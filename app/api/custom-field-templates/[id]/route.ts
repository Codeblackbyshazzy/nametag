import { prisma } from '@/lib/prisma';
import { customFieldTemplateUpdateSchema, validateRequest } from '@/lib/validations';
import { apiResponse, handleApiError, parseRequestBody, withAuth } from '@/lib/api-utils';
import { sanitizeName } from '@/lib/sanitize';

// GET /api/custom-field-templates/[id] - Get a single custom field template
export const GET = withAuth(async (_request, session, context) => {
  try {
    const { id } = await context.params;

    const template = await prisma.customFieldTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    if (!template) {
      return apiResponse.notFound('Custom field template not found');
    }

    return apiResponse.ok({ template });
  } catch (error) {
    return handleApiError(error, 'custom-field-templates-get');
  }
});

// PUT /api/custom-field-templates/[id] - Update a custom field template
export const PUT = withAuth(async (request, session, context) => {
  try {
    const { id } = await context.params;

    const body = await parseRequestBody(request);
    const validation = validateRequest(customFieldTemplateUpdateSchema, body);

    if (!validation.success) {
      return validation.response;
    }

    const { name, options } = validation.data;

    // Load existing template
    const existing = await prisma.customFieldTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiResponse.notFound('Custom field template not found');
    }

    // Detect option renames for SELECT type (positional comparison)
    const shouldCascadeRenames =
      options !== undefined &&
      existing.type === 'SELECT' &&
      options.length === existing.options.length;

    const renames: Array<{ from: string; to: string }> = [];
    if (shouldCascadeRenames) {
      for (let i = 0; i < existing.options.length; i++) {
        const oldOption = existing.options[i];
        const newOption = options[i];
        if (oldOption !== newOption) {
          renames.push({ from: oldOption, to: newOption });
        }
      }
    }

    // Build update data (slug is immutable — never updated)
    const updateData: { name?: string; options?: string[] } = {};
    if (name !== undefined) {
      updateData.name = sanitizeName(name) || name;
    }
    if (options !== undefined) {
      updateData.options = options;
    }

    let template: typeof existing;

    if (renames.length > 0) {
      // Wrap in a transaction to cascade option renames
      template = await prisma.$transaction(async (tx) => {
        const updated = await tx.customFieldTemplate.update({
          where: { id },
          data: updateData,
        });

        for (const { from, to } of renames) {
          await tx.personCustomFieldValue.updateMany({
            where: { templateId: id, value: from },
            data: { value: to },
          });
        }

        return updated;
      });
    } else {
      template = await prisma.customFieldTemplate.update({
        where: { id },
        data: updateData,
      });
    }

    return apiResponse.ok({ template });
  } catch (error) {
    return handleApiError(error, 'custom-field-templates-update');
  }
});

// DELETE /api/custom-field-templates/[id] - Soft-delete a custom field template
export const DELETE = withAuth(async (_request, session, context) => {
  try {
    const { id } = await context.params;

    const existing = await prisma.customFieldTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiResponse.notFound('Custom field template not found');
    }

    await prisma.customFieldTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiResponse.success();
  } catch (error) {
    return handleApiError(error, 'custom-field-templates-delete');
  }
});
