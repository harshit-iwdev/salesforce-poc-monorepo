import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactDto {
  @ApiProperty({ example: '003Hs00002XxYzZIAZ', description: 'Salesforce record ID' })
  Id: string;

  @ApiPropertyOptional({ example: 'Jane', description: 'First name' })
  FirstName: string | null;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  LastName: string;

  @ApiPropertyOptional({ example: 'jane.doe@acme.com', description: 'Email address' })
  Email: string | null;

  @ApiPropertyOptional({ example: '+1 415-555-0101', description: 'Phone number' })
  Phone: string | null;

  @ApiPropertyOptional({ example: 'VP of Engineering', description: 'Job title' })
  Title: string | null;

  @ApiPropertyOptional({ example: '001Hs00002XxYzZIAZ', description: 'Parent Account ID' })
  AccountId: string | null;

  @ApiPropertyOptional({ example: 'Engineering', description: 'Department' })
  Department: string | null;

  @ApiPropertyOptional({ example: 'Web', description: 'Lead source channel' })
  LeadSource: string | null;
}

