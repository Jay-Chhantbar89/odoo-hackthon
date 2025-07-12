import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { AuthRequest, authenticateToken, requireUser } from '../middleware/auth';

const router = Router();

// Create answer
router.post('/', authenticateToken, requireUser, [
  body('content').isLength({ min: 10 }),
  body('questionId').notEmpty()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, questionId } = req.body;
    const userId = req.user!.id;

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        authorId: userId,
        questionId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Answer posted successfully',
      answer
    });
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({ error: 'Failed to post answer' });
  }
});

// Update answer
router.put('/:id', authenticateToken, requireUser, [
  body('content').isLength({ min: 10 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    const answer = await prisma.answer.findUnique({
      where: { id }
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.authorId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to edit this answer' });
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      message: 'Answer updated successfully',
      answer: updatedAnswer
    });
  } catch (error) {
    console.error('Update answer error:', error);
    res.status(500).json({ error: 'Failed to update answer' });
  }
});

// Delete answer
router.delete('/:id', authenticateToken, requireUser, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const answer = await prisma.answer.findUnique({
      where: { id }
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.authorId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this answer' });
    }

    await prisma.answer.delete({
      where: { id }
    });

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({ error: 'Failed to delete answer' });
  }
});

// Vote on answer
router.post('/:id/vote', authenticateToken, requireUser, [
  body('value').isIn([1, -1])
], async (req: AuthRequest, res: Response) => {
  try {
    console.log('Answer vote request received:', { answerId: req.params.id, value: req.body.value, userId: req.user?.id })
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Answer vote validation errors:', errors.array())
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { value } = req.body;
    const userId = req.user!.id;

    console.log('Processing answer vote:', { answerId: id, value, userId })

    const answer = await prisma.answer.findUnique({
      where: { id }
    });

    if (!answer) {
      console.log('Answer not found for voting:', id)
      return res.status(404).json({ error: 'Answer not found' });
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_answerId: {
          userId,
          answerId: id
        }
      }
    });

    if (existingVote) {
      if (existingVote.value === value) {
        console.log('Removing existing answer vote:', existingVote.id)
        await prisma.vote.delete({
          where: { id: existingVote.id }
        });
      } else {
        console.log('Updating existing answer vote:', existingVote.id, 'to', value)
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value }
        });
      }
    } else {
      console.log('Creating new vote for answer:', id)
      await prisma.vote.create({
        data: {
          userId,
          answerId: id,
          value
        }
      });
    }

    console.log('Answer vote processed successfully')
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Answer vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

export default router; 