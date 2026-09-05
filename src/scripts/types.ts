export interface TerminalPost {
  id: string;
  filename: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  url: string;
  readingTime: string;
  wordsText: string;
}

export interface HomePageData {
  posts: TerminalPost[];
  basePath: string;
}
