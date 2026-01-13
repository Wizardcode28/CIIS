import Papa from 'papaparse';
import { ReportData, ProcessedReportData, ChartDataPoint, TimelineDataPoint } from '@/types/report';

// Column name aliases for robust parsing
const COLUMN_ALIASES: Record<string, string[]> = {
  'text_for_analysis': ['text_for_analysis', 'text', 'content', 'message'],
  'clean_text': ['clean_text', 'cleantext', 'cleaned_text', 'processed_text'],
  'sentiment': ['sentiment', 'sentiment_label', 'Sentiment'],
  'sentiment_score': ['sentiment_score', 'sentimentscore', 'score'],
  'nature': ['nature', 'Nature', 'category', 'classification'],
  'topic': ['topic', 'Topic', 'topic_id'],
  'dangerous': ['dangerous', 'Dangerous', 'flagged', 'risk'],
  'created_at': ['created_at', 'createdAt', 'created', 'date', 'timestamp'],
  'subreddit': ['subreddit', 'source', 'community'],
  'username': ['username', 'user', 'author'],
  'url': ['url', 'link', 'source_url']
};

function normalizeColumnName(originalName: string): string {
  const lowerName = originalName.toLowerCase().trim();
  
  for (const [standard, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some(alias => lowerName === alias.toLowerCase())) {
      return standard;
    }
  }
  
  return originalName;
}

function normalizeBooleanValue(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return Boolean(value);
}

function normalizeDate(value: string): Date {
  // Handle relative dates like "22 days ago"
  if (value.includes('ago')) {
    const match = value.match(/(\d+)\s+(day|week|month|year)s?\s+ago/);
    if (match) {
      const [, amount, unit] = match;
      const date = new Date();
      const num = parseInt(amount);
      
      switch (unit) {
        case 'day':
          date.setDate(date.getDate() - num);
          break;
        case 'week':
          date.setDate(date.getDate() - (num * 7));
          break;
        case 'month':
          date.setMonth(date.getMonth() - num);
          break;
        case 'year':
          date.setFullYear(date.getFullYear() - num);
          break;
      }
      
      return date;
    }
  }
  
  // Try to parse as regular date
  return new Date(value);
}

export function parseCSV(csvContent: string): Promise<ProcessedReportData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        return value;
      },
      transformHeader: (header) => {
        return normalizeColumnName(header);
      },
      complete: (results) => {
        try {
          const processedData: ProcessedReportData[] = results.data
            .map((row: any) => {
              // Normalize the row data
              const normalized: any = {};
              
              Object.entries(row).forEach(([key, value]) => {
                const normalizedKey = normalizeColumnName(key);
                normalized[normalizedKey] = value;
              });
              
              return {
                text_for_analysis: normalized.text_for_analysis || '',
                clean_text: normalized.clean_text || normalized.text_for_analysis || '',
                sentiment: normalized.sentiment || 'NEUTRAL',
                sentiment_score: parseFloat(normalized.sentiment_score) || 0,
                nature: normalized.nature || 'neutral',
                topic: normalized.topic ? (typeof normalized.topic === 'number' ? normalized.topic : parseInt(normalized.topic) || normalized.topic) : '',
                dangerous: normalizeBooleanValue(normalized.dangerous),
                created_at: normalized.created_at || new Date().toISOString(),
                score: parseFloat(normalized.score) || 0,
                subreddit: normalized.subreddit || '',
                username: normalized.username || '',
                url: normalized.url || ''
              } as ProcessedReportData;
            })
            .filter(row => row.clean_text.trim().length > 0);
          
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export function generateChartData(data: ProcessedReportData[]): {
  sentiment: ChartDataPoint[];
  nature: ChartDataPoint[];
  topics: ChartDataPoint[];
  timeline: TimelineDataPoint[];
} {
  // Sentiment distribution
  const sentimentCounts = data.reduce((acc, item) => {
    const sentiment = item.sentiment.toUpperCase();
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentiment = Object.entries(sentimentCounts).map(([name, value]) => ({
    name,
    value,
    color: name === 'POSITIVE' ? '#A2C181' : name === 'NEGATIVE' ? '#F28B82' : '#4F81BD'
  }));

  // Nature distribution
  const natureCounts = data.reduce((acc, item) => {
    const nature = item.nature;
    acc[nature] = (acc[nature] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const nature = Object.entries(natureCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Topics distribution
  const topicCounts = data.reduce((acc, item) => {
    const topic = item.topic?.toString() || 'Unknown';
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topics = Object.entries(topicCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Timeline data
  const dateCounts = data.reduce((acc, item) => {
    try {
      const date = normalizeDate(item.created_at);
      const dateKey = date.toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + 1;
    } catch {
      // Skip invalid dates
    }
    return acc;
  }, {} as Record<string, number>);

  const timeline = Object.entries(dateCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return { sentiment, nature, topics, timeline };
}

// Generate top words from clean text
export function generateTopWords(data: ProcessedReportData[], limit: number = 20): ChartDataPoint[] {
  const stopWords = new Set([
    // Articles
    'the', 'a', 'an',
    'comments',
    'nan',
    // Conjunctions
    'and', 'or', 'but', 'nor', 'yet', 'so', 'for',
    // Prepositions
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'against', 'within', 'without', 'throughout', 'towards', 'upon', 'across', 'behind', 'beyond', 'under', 'over',
    // Pronouns
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves', 'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
    // Verbs (common auxiliary and linking verbs)
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'ought', 'need', 'dare', 'am', 'get', 'got', 'getting', 'go', 'goes', 'went', 'going', 'come', 'came', 'coming', 'take', 'took', 'taken', 'taking', 'make', 'made', 'making', 'see', 'saw', 'seen', 'seeing', 'know', 'knew', 'known', 'knowing', 'think', 'thought', 'thinking', 'say', 'said', 'saying', 'tell', 'told', 'telling', 'ask', 'asked', 'asking', 'work', 'worked', 'working', 'seem', 'seemed', 'seeming', 'feel', 'felt', 'feeling', 'try', 'tried', 'trying', 'leave', 'left', 'leaving', 'call', 'called', 'calling',
    // Adverbs
    'not', 'no', 'yes', 'very', 'too', 'only', 'just', 'now', 'then', 'here', 'there', 'where', 'when', 'why', 'how', 'all', 'any', 'some', 'each', 'every', 'either', 'neither', 'both', 'few', 'many', 'much', 'more', 'most', 'other', 'another', 'such', 'own', 'same', 'so', 'than', 'too', 'also', 'well', 'back', 'even', 'still', 'way', 'down', 'out', 'off', 'over', 'again', 'further', 'then', 'once',
    // Common words
    'as', 'if', 'because', 'while', 'since', 'until', 'where', 'although', 'though', 'unless', 'whether', 'whereas', 'wherever', 'whenever', 'however', 'whatever', 'whoever', 'whichever', 'than', 'rather', 'quite', 'enough', 'indeed', 'certainly', 'perhaps', 'probably', 'possibly', 'maybe', 'definitely', 'absolutely', 'really', 'actually', 'basically', 'generally', 'specifically', 'particularly', 'especially', 'mainly', 'mostly', 'usually', 'often', 'sometimes', 'always', 'never', 'ever', 'already', 'yet', 'still', 'again', 'once', 'twice', 'first', 'second', 'third', 'last', 'next', 'previous', 'another', 'other', 'same', 'different', 'new', 'old', 'good', 'bad', 'great', 'small', 'big', 'large', 'little', 'long', 'short', 'high', 'low', 'right', 'wrong', 'true', 'false', 'real', 'sure', 'okay', 'ok', 'fine', 'nice', 'well', 'better', 'best', 'worse', 'worst',
    // Internet/social media common words
    'like', 'comment', 'share', 'post', 'posts', 'user', 'users', 'people', 'person', 'time', 'times', 'day', 'days', 'year', 'years', 'thing', 'things', 'way', 'ways', 'place', 'places', 'part', 'parts', 'number', 'numbers', 'word', 'words', 'question', 'questions', 'answer', 'answers', 'problem', 'problems', 'use', 'used', 'using', 'find', 'found', 'finding', 'give', 'gave', 'given', 'giving', 'show', 'showed', 'shown', 'showing', 'help', 'helped', 'helping', 'move', 'moved', 'moving', 'turn', 'turned', 'turning', 'start', 'started', 'starting', 'play', 'played', 'playing', 'run', 'ran', 'running', 'live', 'lived', 'living', 'believe', 'believed', 'believing',
    // Numbers
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'million', 'billion'
  ]);

  const wordCounts: Record<string, number> = {};
  
  data.forEach(item => {
    const words = item.clean_text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });

  return Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}