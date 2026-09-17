import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpportunityDto {
  @ApiProperty({ example: '006Hs00002XxYzZIAZ', description: 'Salesforce record ID' })
  Id: string;

  @ApiProperty({ example: 'Acme - Enterprise Deal', description: 'Opportunity name' })
  Name: string;

  @ApiProperty({ example: 'Proposal/Price Quote', description: 'Current pipeline stage' })
  StageName: string;

  @ApiPropertyOptional({ example: 75000, description: 'Deal amount in USD' })
  Amount: number | null;

  @ApiProperty({ example: '2026-12-31', description: 'Expected close date (YYYY-MM-DD)' })
  CloseDate: string;

  @ApiPropertyOptional({ example: 60, description: 'Win probability (0–100)' })
  Probability: number | null;

  @ApiPropertyOptional({ example: '001Hs00002XxYzZIAZ', description: 'Parent Account ID' })
  AccountId: string | null;

  @ApiPropertyOptional({ example: 'Web', description: 'Lead source channel' })
  LeadSource: string | null;

  @ApiPropertyOptional({ example: 'New Business', description: 'Opportunity type' })
  Type: string | null;

  @ApiProperty({ example: false, description: 'Whether the opportunity is closed' })
  IsClosed: boolean;

  @ApiProperty({ example: false, description: 'Whether the opportunity was won' })
  IsWon: boolean;
}

