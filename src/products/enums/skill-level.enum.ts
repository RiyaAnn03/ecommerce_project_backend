import { registerEnumType } from '@nestjs/graphql';
import { SkillLevel } from '@prisma/client';

registerEnumType(SkillLevel, { name: 'SkillLevel' });

export { SkillLevel };
