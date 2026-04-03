import type { GrammarExample } from '@/types/ast';

export const urlExample: GrammarExample = {
  id: 'url-parser',
  name: 'URL Parser',
  description: 'Parse and validate URLs with protocol, domain, path, query parameters, and fragments',
  grammar: `URLParser {
  URL
    = Protocol "://" Domain Port? Path? Query? Fragment?

  Protocol
    = "https"
    | "http"
    | "ftp"
    | "ws"
    | "wss"

  Domain
    = listOf<Subdomain, ".">

  Subdomain
    = (alnum | "-")+

  Port
    = ":" PortNumber

  PortNumber
    = digit+

  Path
    = "/" Segments

  Segments
    = listOf<Segment, "/">
  
  Segment
    = segmentChar+
    
   segmentChar
    = (alnum | "-" | "_" | "." | "~")

  Query
    = "?" QueryPair ("&" QueryPair)*

  QueryPair
    = Key "=" Value

  Key
    = (alnum | "-" | "_")+

  Value
    = (alnum | "-" | "_" | "%" | "." | "~")*

  Fragment
    = "#" FragmentContent

  FragmentContent
    = (alnum | "-" | "_" | "/")*
}`,
  sampleInput: 'https://www.example.com:8080/path/to/page?name=John&age=30#section',
};



