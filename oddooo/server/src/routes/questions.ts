import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { AuthRequest, authenticateToken, requireUser } from '../middleware/auth';

const router = Router();

// Get all questions with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const tags = req.query.tags as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';
    const userId = req.query.userId as string; // Get userId from query params

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = {
        some: {
          name: { in: tagArray }
        }
      };
    }

    // Get questions with related data
    const questions = await prisma.question.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        tags: true,
        answers: {
          select: {
            id: true
          }
        },
        votes: {
          ...(userId && {
            where: {
              userId: userId
            }
          })
        },
        _count: {
          select: {
            answers: true,
            votes: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    });

    // Calculate vote counts and format response
    const formattedQuestions = questions.map((question: any) => {
      const voteCount = question.votes.reduce((sum: number, vote: any) => sum + vote.value, 0);
      const userVote = userId ? question.votes.find((vote: any) => vote.userId === userId) : null;
      
      return {
        ...question,
        voteCount,
        answerCount: question._count.answers,
        userVote: userVote ? userVote.value : null,
        votes: undefined,
        _count: undefined
      };
    });

    // Get total count for pagination
    const total = await prisma.question.count({ where });

    res.json({
      questions: formattedQuestions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get single question by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string; // Get userId from query params

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        tags: true,
        answers: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            votes: {
              ...(userId && {
                where: {
                  userId: userId
                }
              })
            },
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true
                  }
                }
              }
            },
            _count: {
              select: {
                votes: true,
                comments: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        votes: {
          ...(userId && {
            where: {
              userId: userId
            }
          })
        },
        acceptedAnswer: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            answers: true,
            votes: true
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Calculate vote counts and user votes
    const questionVoteCount = question.votes.reduce((sum: number, vote: any) => sum + vote.value, 0);
    const questionUserVote = userId ? question.votes.find((vote: any) => vote.userId === userId) : null;
    
    const formattedAnswers = question.answers.map((answer: any) => {
      const answerVoteCount = answer.votes.reduce((sum: number, vote: any) => sum + vote.value, 0);
      const answerUserVote = userId ? answer.votes.find((vote: any) => vote.userId === userId) : null;
      
      return {
        ...answer,
        voteCount: answerVoteCount,
        userVote: answerUserVote ? answerUserVote.value : null,
        votes: undefined
      };
    });

    res.json({
      ...question,
      voteCount: questionVoteCount,
      userVote: questionUserVote ? questionUserVote.value : null,
      answers: formattedAnswers,
      votes: undefined,
      _count: undefined
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// Create new question
router.post('/', authenticateToken, requireUser, [
  body('title').isLength({ min: 10, max: 200 }),
  body('description').isLength({ min: 20 }),
  body('tags').isArray({ min: 1, max: 5 })
], async (req: AuthRequest, res: Response) => {
  try {
    console.log('Create question request received:', req.body)
    console.log('User from request:', req.user)
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array())
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, tags } = req.body;
    const userId = req.user!.id;

    console.log('Processing question data:', { title, description, tags, userId })

    // Process tags
    const tagNames = tags.map((tag: string) => tag.trim().toLowerCase());
    
    // Create or connect tags
    const tagOperations = tagNames.map((name: string) => ({
      where: { name },
      create: { name }
    }));

    console.log('Tag operations:', tagOperations)

    const question = await prisma.question.create({
      data: {
        title,
        description,
        authorId: userId,
        tags: {
          connectOrCreate: tagOperations
        }
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        tags: true
      }
    });

    console.log('Question created successfully:', question)

    res.status(201).json({
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Update question
router.put('/:id', authenticateToken, requireUser, [
  body('title').optional().isLength({ min: 10, max: 200 }),
  body('description').optional().isLength({ min: 20 }),
  body('tags').optional().isArray({ min: 1, max: 5 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, tags } = req.body;
    const userId = req.user!.id;

    // Check if question exists and user owns it
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      include: { tags: true }
    });

    if (!existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (existingQuestion.authorId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to edit this question' });
    }

    // Process tags if provided
    let tagOperations = undefined;
    if (tags) {
      const tagNames = tags.map((tag: string) => tag.trim().toLowerCase());
      tagOperations = {
        set: [],
        connectOrCreate: tagNames.map((name: string) => ({
          where: { name },
          create: { name }
        }))
      };
    }

    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(tags && { tags: tagOperations })
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        tags: true
      }
    });

    res.json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question
router.delete('/:id', authenticateToken, requireUser, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const question = await prisma.question.findUnique({
      where: { id }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.authorId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this question' });
    }

    await prisma.question.delete({
      where: { id }
    });

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Vote on question
router.post('/:id/vote', authenticateToken, requireUser, [
  body('value').isIn([1, -1])
], async (req: AuthRequest, res: Response) => {
  try {
    console.log('Question vote request received:', { questionId: req.params.id, value: req.body.value, userId: req.user?.id })
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Vote validation errors:', errors.array())
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { value } = req.body;
    const userId = req.user!.id;

    console.log('Processing vote:', { questionId: id, value, userId })

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id }
    });

    if (!question) {
      console.log('Question not found for voting:', id)
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId: id
        }
      }
    });

    if (existingVote) {
      // Update existing vote
      if (existingVote.value === value) {
        // Remove vote if same value
        console.log('Removing existing vote:', existingVote.id)
        await prisma.vote.delete({
          where: { id: existingVote.id }
        });
      } else {
        // Update vote
        console.log('Updating existing vote:', existingVote.id, 'to', value)
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value }
        });
      }
    } else {
      // Create new vote
      console.log('Creating new vote for question:', id)
      await prisma.vote.create({
        data: {
          userId,
          questionId: id,
          value
        }
      });
    }

    console.log('Vote processed successfully')
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Accept answer
router.post('/:id/accept-answer/:answerId', authenticateToken, requireUser, async (req: AuthRequest, res: Response) => {
  try {
    const { id, answerId } = req.params;
    const userId = req.user!.id;

    // Check if question exists and user owns it
    const question = await prisma.question.findUnique({
      where: { id }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.authorId !== userId) {
      return res.status(403).json({ error: 'Only question author can accept answers' });
    }

    // Check if answer exists and belongs to this question
    const answer = await prisma.answer.findFirst({
      where: {
        id: answerId,
        questionId: id
      }
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Update question to accept this answer
    await prisma.question.update({
      where: { id },
      data: { acceptedAnswerId: answerId }
    });

    res.json({ message: 'Answer accepted successfully' });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({ error: 'Failed to accept answer' });
  }
});

export default router; 