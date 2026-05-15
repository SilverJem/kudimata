import { TransactionType } from '../types/enums';

export interface ParsedTransaction {
    amount: number;
    category: string;
    type: TransactionType;
    note?: string;
}

export class ParserService {
    private static CATEGORY_MAPPING: Record<string, string> = {
        'food': 'Food',
        'shawarma': 'Food',
        'lunch': 'Food',
        'dinner': 'Food',
        'fuel': 'Transport',
        'uber': 'Transport',
        'bolt': 'Transport',
        'transport': 'Transport',
        'salary': 'Salary',
        'rent': 'Rent',
        'bills': 'Bills',
        'shopping': 'Shopping',
    };

    static parse(text: string): ParsedTransaction | null {
        const lowerText = text.toLowerCase();
        
        // 1. Extract Amount (handles 5k, 5000, 5,000)
        const amountRegex = /(\d+(?:\.\d+)?)\s*(k)?/i;
        const amountMatch = lowerText.match(amountRegex);
        if (!amountMatch) return null;

        let amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (amountMatch[2]?.toLowerCase() === 'k') {
            amount *= 1000;
        }

        // 2. Determine Type
        let type = TransactionType.EXPENSE;
        if (lowerText.includes('received') || lowerText.includes('salary') || lowerText.includes('income')) {
            type = TransactionType.INCOME;
        }

        // 3. Extract Category
        let category = 'Other';
        for (const [keyword, mappedCategory] of Object.entries(this.CATEGORY_MAPPING)) {
            if (lowerText.includes(keyword)) {
                category = mappedCategory;
                break;
            }
        }

        return {
            amount,
            type,
            category,
            note: text.length > 20 ? text : undefined
        };
    }
}
