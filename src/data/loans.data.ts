import type { Loan } from '@/types/loans.type'

const loans: Loan[] = [
  {
    name: "Icel",
    before: 162565.25,
    remaining: 117565.25,
    history: [
      {
        date: "February 3",
        amount: 20000,
        type: "payment",
      },
      {
        date: "March",
        amount: 25000,
        type: "payment",
      },
    ],
  },
];