import { prisma } from '@/lib/prisma';
import { updateGraphDisplaySchema, validateRequest } from '@/lib/validations';
import { apiResponse, handleApiError, parseRequestBody, withAuth } from '@/lib/api-utils';

export const PUT = withAuth(async (request, session) => {
  try {
    const body = await parseRequestBody(request);
    const validation = validateRequest(updateGraphDisplaySchema, body);

    if (!validation.success) {
      return validation.response;
    }

    const { graphMode, graphBubbleThreshold } = validation.data;
    const data: { graphMode?: string | null; graphBubbleThreshold?: number } = {};
    if (graphMode !== undefined) data.graphMode = graphMode;
    if (graphBubbleThreshold !== undefined) data.graphBubbleThreshold = graphBubbleThreshold;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    return apiResponse.ok({ user });
  } catch (error) {
    return handleApiError(error, 'user-graph-display-update');
  }
});
