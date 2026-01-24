// src/latexData.ts

export type LatexItem = {
  id: string;
  content: string;
};

const rawCases = [
  // 1. Text + Inline Math
  "This question is straightforward. Let's solve it step by step. Remember: speed = distance / time.",

  // 2. Inline Math mix
  'The formula for speed is $v = \\frac{d}{t}$. We know that $a^2 + b^2 = c^2$ from the Pythagorean theorem.',

  // 3. Conditional Math
  'If $x > 0$ and $x \\neq 1$, then $\\log x$ is defined and $x^n$ grows exponentially.',

  // 4. Block Math (Double $$)
  'To calculate the area, we integrate the function:\n$$\nA = \\int_a^b f(x)\\,dx\n$$\nNow substitute the limits.',

  // 5. Complex Inline Fraction
  'Consider the function $f(x) = \\frac{(x^2 + 3x + 5)(x^3 - 2x + 7)(x^4 + x^2 + 1)}{(x - 1)(x + 2)(x^2 + x + 1)}$ and analyze its behavior.',

  // 6. Large Inline Math (Should wrap/scale)
  'We now simplify $ \\frac{(a_1 + a_2 + a_3 + \\cdots + a_n)^2}{sqrt{(b_1^2 + b_2^2 + \\cdots + b_n^2)(c_1^2 + c_2^2 + \\cdots + c_n^2)}} $ before proceeding further in the solution.',

  // 7. Massive Equation (Overflow Test)
  '$ \\left(a_1 + a_2 + a_3 + a_4 + a_5 + a_6 + a_7 + a_8 + a_9 + a_{10} + a_{11} + a_{12} + a_{13} + a_{14} + a_{15} + a_{16} + a_{17} + a_{18} + a_{19} + a_{20} + a_{21} + a_{22} + a_{23} + a_{24} + a_{25} + \\cdots + a_n \\right)^2 $',

  // 8. Multiple Block Math
  'Using the identities:\n$$\n\\sin^2 x + \\cos^2 x = 1\n$$\nand\n$$\n\\tan x = \\frac{\\sin x}{\\cos x}\n$$\nwe can derive the result.',

  // 9. Mixed Step-by-Step
  "Let's solve this step by step.\nFirst, recall the identity $a^2 - b^2 = (a-b)(a+b)$.\nNow apply it to the expression:\n$$\nx^2 - 9\n$$\nFinally, factorize and simplify.",

  // 10. Invalid Syntax (Graceful Failure Test)
  'This expression is wrong: $ \\frac{a+b }{ c $ and should not crash.',

  // 11. Incomplete Syntax
  'Try rendering this: $ \\sqrt{2 + $ which is invalid.',

  // 12. Unsupported Command
  'Here is something unsupported: $ \\unknowncommand{x} $.',

  // 13. Currency Trick (Plain $)
  'The total cost is $500 and the discount is $50.',

  // 14. Currency Start
  'He earned $1000 in his first job.',

  // 15. Currency Trick 2
  'The equation $ 50x + 10y = 100 $ has no solution.',
];

// 15. The Stress Test (50 items)
// We repeat case 6 fifty times as requested
const stressTest = Array.from(
  { length: 50 },
  () =>
    `We now simplify $ \\frac{(a_1 + a_2 + a_3 + \\cdots + a_n)^2}{\sqrt{(b_1^2 + b_2^2 + \\cdots + b_n^2)(c_1^2 + c_2^2 + \\cdots + c_n^2)}} $`,
);

// Combine all 63 items
export const LATEX_DATA: LatexItem[] = [...rawCases, ...stressTest].map(
  (content, index) => ({
    id: (index + 1).toString(),
    content,
  }),
);
