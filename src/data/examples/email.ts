import type { GrammarExample } from '@/types/ast';

export const emailExample: GrammarExample = {
  id: 'email-parser',
  name: 'Email Address Parser',
  description: 'Validate and parse email addresses with local part and domain',
  grammar: `EmailParser {
  Email
    = Local "@" Domain

  Local
    = nonemptyListOf<LocalPart, ".">
    
  LocalPart
    = (alnum | "_" | "-" | "+")+

  Domain
    = nonemptyListOf<Subdomain, ".">

  Subdomain
    = letter (alnum | "-")*
}`,
  sampleInput: 'john.doe@example.company.com',
};


