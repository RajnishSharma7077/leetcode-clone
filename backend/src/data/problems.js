const easyNames = [
  'Two Sum', 'Best Time to Buy and Sell Stock', 'Valid Palindrome', 'Roman to Integer', 'Contains Duplicate',
  'Valid Anagram', 'Binary Search', 'Fibonacci Number', 'Palindrome Number', 'Merge Sorted Array',
  'Majority Element', 'Happy Number', 'Climbing Stairs', 'Single Number', 'Longest Common Prefix',
  'Isomorphic Strings', 'Word Pattern', 'Reverse String', 'Move Zeroes', 'Squares of a Sorted Array',
  'Maximum Subarray', 'Search Insert Position', 'Find All Numbers Disappeared in an Array', 'Plus One',
  'Intersection of Two Arrays II', 'Min Cost Climbing Stairs', 'Middle of the Linked List', 'Remove Duplicates from Sorted Array',
  'Best Time to Buy and Sell Stock II', 'Linked List Cycle', 'Reverse Linked List', 'Symmetric Tree',
  'Maximum Depth of Binary Tree', 'Path Sum', 'Diameter of Binary Tree', 'Invert Binary Tree', 'Same Tree',
  'Subtree of Another Tree', 'Lowest Common Ancestor of a BST', 'Kth Largest Element in an Array',
  'Pairs of Songs With Total Durations Divisible by 60', 'First Bad Version', 'Convert Sorted Array to Binary Search Tree',
  'Permutations', 'Combination Sum', 'Unique Paths', 'House Robber', 'Ugly Number', 'Count Primes',
  'Top K Frequent Elements', 'Product of Array Except Self', 'Find the Index of the First Occurrence in a String',
  'Maximum Number of Balloons', 'Sort Array By Parity', 'Number of Recent Calls', 'Best Time to Buy and Sell Stock with Cooldown',
  'Add Digits', 'Power of Two', 'Range Sum Query - Immutable', 'Koko Eating Bananas', 'Min Stack', 'Missing Number',
  'Length of Last Word', 'N-Queens', 'Valid Parentheses', 'Generate Parentheses', 'Set Matrix Zeroes', 'Group Anagrams'
];

const mediumNames = [
  'Longest Substring Without Repeating Characters', 'Add Two Numbers', 'Container With Most Water', 'Three Sum',
  'Integer to Roman', 'String to Integer (atoi)', 'Zigzag Conversion', 'Longest Palindromic Substring',
  'Median of Two Sorted Arrays', 'Letter Combinations of a Phone Number', 'Remove Nth Node From End of List',
  'Generate Parentheses', 'Permutation Sequence', 'Rotate Image', 'Group Anagrams', 'Pow(x, n)', 'Jump Game',
  'Unique Paths II', 'Minimum Path Sum', 'Decode Ways', 'Coin Change', 'Word Break', 'Binary Tree Level Order Traversal',
  'Construct Binary Tree from Preorder and Inorder Traversal', 'Serialize and Deserialize Binary Tree',
  'Top K Frequent Elements', 'Longest Increasing Subsequence', 'Longest Common Subsequence', 'Partition Equal Subset Sum',
  'House Robber II', 'Combination Sum IV', 'Task Scheduler', 'Find Minimum in Rotated Sorted Array II',
  'Product of Array Except Self', 'Maximum Product Subarray', 'Subarray Sum Equals K', 'Search in Rotated Sorted Array',
  'Sort Colors', 'Word Search', 'Kth Smallest Element in a Sorted Matrix', 'Minimum Number of Refueling Stops',
  'Course Schedule', 'Coin Change 2', 'Longest Repeating Character Replacement', 'Palindromic Substrings',
  'Number of Islands', 'Valid Sudoku', 'Game of Life', 'Edit Distance', 'Minimum Cost to Connect Sticks',
  'Insert Interval', 'Merge Intervals', 'Non-overlapping Intervals', 'Minimum Size Subarray Sum', 'Next Permutation',
  'Find Peak Element', 'Distinct Subsequences', 'Additive Number', 'Decode String', 'Maximum Sum Circular Subarray',
  'Shortest Bridge', 'Minimum Falling Path Sum', 'Boundary of Binary Tree', 'Path With Minimum Effort',
  'Deepest Leaves Sum', 'Count Good Nodes in Binary Tree', 'Time Needed to Inform All Employees', 'Most Stones Removed with Same Row or Column',
  'Maximum Number of Achievable Transfer Requests', 'Minimum Common Value', 'Minimum Domino Rotations For Equal Row',
  'Construct Target Array With Multiple Sums', 'Largest Divisible Subset', 'All Paths From Source to Target'
];

const hardNames = [
  'Median of Two Sorted Arrays', 'Regular Expression Matching', 'Trapping Rain Water', 'Wildcard Matching',
  'Merge k Sorted Lists', 'Largest Rectangle in Histogram', 'First Missing Positive', 'Substring with Concatenation of All Words',
  'The Skyline Problem', 'Best Time to Buy and Sell Stock III', 'Maximal Rectangle', 'Minimum Window Substring',
  'Word Ladder II', 'Scramble String', 'Distinct Subsequences II', 'Candy', 'Maximum Gap', 'Shortest Palindrome',
  'Longest Valid Parentheses', 'Edit Distance', 'Palindrome Partitioning II', 'Burst Balloons', 'Smallest Range Covering Elements from K Lists',
  'Count of Smaller Numbers After Self', 'Perfect Rectangle', 'Range Module', 'Serialize and Deserialize N-ary Tree',
  'Kth Smallest Number in Multiplication Table', 'Minimum Cost to Cut a Stick', 'N-Queens II', 'Find Median from Data Stream',
  'Basic Calculator', 'Cherry Pickup', 'Binary Tree Maximum Path Sum', 'LFU Cache', 'Longest Consecutive Sequence',
  'Minimum Window Subsequence', 'Palindrome Pairs', 'Sliding Window Maximum', 'Alien Dictionary', 'Word Ladder',
  'Employee Importance', 'Shortest Path in a Grid with Obstacles Elimination', 'Most Stones Removed with Same Row or Column',
  'Integer Break', 'Orderly Queue', 'Recover a Tree From Preorder Traversal', 'Minimum Score Triangulation',
  'Maximum Frequency Stack', 'Sudoku Solver', 'Dungeon Game', 'Cut Off Trees for Golf Event', 'Count Ways to Build Rooms in an Ant Colony',
  'All O`one Data Structure', 'Minimum Number of K-Sum Pairs', 'Maximum Profit in Job Scheduling', 'Minimum Cost to Merge Stones',
  'Frog Jump', 'Minimum Cost to Make Array Equal', 'Longest Path with Different Adjacent Characters', 'Smallest Missing Genetic Value in Each Tree',
  'Concatenated Words', 'Employee Free Time', 'Largest Sum of Averages', 'K-Sum', 'Construct Quad Tree'
];

const problemCategories = [
  'Array', 'String', 'Hash Map', 'Greedy', 'Binary Search', 'Dynamic Programming', 'Graph', 'Tree', 'Stack',
  'Queue', 'Backtracking', 'Sorting', 'Two Pointers', 'Sliding Window', 'Heap', 'Trie', 'Math', 'Bit Manipulation',
  'Union Find', 'Linked List', 'Recursion', 'Breadth-First Search', 'Depth-First Search', 'Design', 'Simulation'
];

const containerLabels = {
  Easy: ['LeetCode Easy', 'Daily Practice', 'Foundation'],
  Medium: ['Interview Prep', 'Contest Style', 'Patience'],
  Hard: ['Advanced', 'Contest Hard', 'Expert']
};

const buildHints = (difficulty, category) => {
  if (difficulty === 'Easy') {
    return [
      `Start by identifying the key pattern behind ${category.toLowerCase()} problems.`,
      'Check constraints carefully to decide whether a brute force or optimized approach is enough.',
      'Validate with a few sample examples before finalizing the logic.'
    ];
  }

  if (difficulty === 'Medium') {
    return [
      `Use a structured breakdown: understand the state, then decide the optimal data structure for ${category.toLowerCase()}.`,
      'Look for monotonic properties, prefix ideas, or a graph interpretation that simplifies the problem.',
      'Verify edge cases such as empty input, duplicates, and boundary values.'
    ];
  }

  return [
    'Reason about the core invariant before coding; this is often the key to hard problems.',
    'Consider reducing the problem to a graph, DP state machine, or optimization problem with monotone decisions.',
    'Stress test with extreme inputs and confirm the algorithm still respects the constraints.'
  ];
};

const buildExplanation = (title, category, difficulty) => {
  const base = `The main idea behind ${title} is to model the problem as a clean state transition over the relevant data structure. In a ${category.toLowerCase()} problem, the best approach usually reduces the search space and avoids repeated work. We keep only the information necessary to decide the next move, which makes the solution efficient under the given constraints.`;

  if (difficulty === 'Easy') {
    return `${base} For an easy variant, a direct scan or a single hash map often suffices. The goal is to reach the correct answer while preserving correctness with minimal complexity.`;
  }

  if (difficulty === 'Medium') {
    return `${base} A medium problem usually needs a more deliberate design: choosing a data structure that supports fast lookup, grouping states, or reducing the problem to a smaller form before solving it.`;
  }

  return `${base} Hard problems generally require a stronger invariant, memoization, pruning, or optimization. The solution is not just correct; it must scale to large inputs while ensuring the algorithmic guarantees remain valid.`;
};

const buildDescription = (title, difficulty, category) => {
  return `Given the problem ${title}, solve it efficiently using the right ${category.toLowerCase()} strategy. This ${difficulty.toLowerCase()} question focuses on understanding the constraints, selecting an appropriate algorithm, and proving the correctness of the approach before implementation.`;
};

const buildExample = (title, difficulty, category) => {
  if (difficulty === 'Easy') {
    return {
      input: `nums = [2, 7, 11, 15], target = 9`,
      output: `[0, 1]`,
      explanation: `For ${title}, the complement 9 - 2 = 7 is found at index 1, so the answer is [0, 1].`
    };
  }

  if (difficulty === 'Medium') {
    return {
      input: `s = "abcabcbb"`,
      output: `3`,
      explanation: `The longest substring without repeating characters is "abc" with length 3.`
    };
  }

  return {
    input: `grid = [[0, 1], [1, 0]]`,
    output: `2`,
    explanation: `The shortest path between the two islands is 2 steps in the transformed graph.`
  };
};

const buildComplexity = (difficulty) => {
  if (difficulty === 'Easy') {
    return {
      time: 'O(n)',
      space: 'O(n)',
      cases: 18,
      rating: 1300
    };
  }

  if (difficulty === 'Medium') {
    return {
      time: 'O(n log n)',
      space: 'O(n)',
      cases: 38,
      rating: 1700
    };
  }

  return {
    time: 'O(n log n) to O(n^2)',
    space: 'O(n)',
    cases: 64,
    rating: 2200
  };
};

const buildProblem = (index, difficulty, title, category, leetcodeBase, cfBase) => {
  const complexity = buildComplexity(difficulty);
  const example = buildExample(title, difficulty, category);

  return {
    id: index,
    title,
    difficulty,
    category,
    tags: [category, difficulty, 'Algorithm'],
    source: 'LeetCode / Codeforces curated archive',
    leetcodeDifficulty: `${leetcodeBase} / 3000`,
    codeforcesDifficulty: `${cfBase} / 2200`,
    rating: complexity.rating,
    description: buildDescription(title, difficulty, category),
    constraints: '1 <= n <= 10^5 where applicable; values are within standard integer ranges for the problem.',
    example,
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
      { input: { nums: [10, 20, 30, 40], target: 50 }, expected: [0, 3] }
    ],
    hints: buildHints(difficulty, category),
    explanation: buildExplanation(title, category, difficulty),
    timeComplexity: complexity.time,
    spaceComplexity: complexity.space,
    casesExecuted: complexity.cases,
    note: `${containerLabels[difficulty][index % containerLabels[difficulty].length]} problem profile`,
    solveRate: `${Math.max(72, 100 - (index % 17) * 3)}%`
  };
};

const difficultyPools = {
  Easy: easyNames,
  Medium: mediumNames,
  Hard: hardNames
};

const difficultyOrder = ['Easy', 'Medium', 'Hard'];

export const problems = Array.from({ length: 500 }, (_, index) => {
  const difficulty = difficultyOrder[index < 215 ? 0 : index < 420 ? 1 : 2];
  const pool = difficultyPools[difficulty];
  const baseName = pool[index % pool.length];
  const category = problemCategories[(index + difficulty.length) % problemCategories.length];
  const leetcodeBase = difficulty === 'Easy' ? 1200 + (index % 8) * 100 : difficulty === 'Medium' ? 1600 + (index % 12) * 80 : 1900 + (index % 11) * 90;
  const cfBase = difficulty === 'Easy' ? 800 + (index % 6) * 120 : difficulty === 'Medium' ? 1200 + (index % 9) * 90 : 1500 + (index % 10) * 90;
  const title = baseName.includes(' ') && index % 4 === 0 ? `${baseName} II` : baseName;

  return buildProblem(index + 1, difficulty, title, category, leetcodeBase, cfBase);
});
