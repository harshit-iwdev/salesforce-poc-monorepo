import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountDto {
  @ApiProperty({ example: '001Hs00002XxYzZIAZ', description: 'Salesforce record ID' })
  Id: string;

  @ApiProperty({ example: 'Acme Corporation', description: 'Account name' })
  Name: string;

  @ApiPropertyOptional({ example: 'Technology', description: 'Industry vertical' })
  Industry: string | null;

  @ApiPropertyOptional({ example: '+1 415-555-0100', description: 'Primary phone number' })
  Phone: string | null;

  @ApiPropertyOptional({ example: 'https://acme.com', description: 'Company website' })
  Website: string | null;

  @ApiPropertyOptional({ example: 'San Francisco', description: 'Billing city' })
  BillingCity: string | null;

  @ApiPropertyOptional({ example: 'USA', description: 'Billing country' })
  BillingCountry: string | null;

  @ApiPropertyOptional({ example: 5000, description: 'Number of employees' })
  NumberOfEmployees: number | null;

  @ApiPropertyOptional({ example: 10000000, description: 'Annual revenue in USD' })
  AnnualRevenue: number | null;

  @ApiPropertyOptional({ example: 'Customer - Direct', description: 'Account type' })
  Type: string | null;
}

