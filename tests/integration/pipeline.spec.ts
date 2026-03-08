import { describe, expect, it } from "vitest";
import { Tyneq } from "../../src";

describe("pipeline integration", () => {
  describe("from → where → select → toArray", () => {
    it("filters and transforms elements in sequence", () => {
      const result = Tyneq.from([1, 2, 3, 4, 5, 6])
        .where(x => x % 2 === 0)
        .select(x => x * x)
        .toArray();
      expect(result).toEqual([4, 16, 36]);
    });

    it("returns empty array when no elements pass the filter", () => {
      const result = Tyneq.from([1, 3, 5])
        .where(x => x % 2 === 0)
        .select(x => x * 10)
        .toArray();
      expect(result).toEqual([]);
    });
  });

  describe("from → orderBy → skip → take → toArray", () => {
    it("sorts then pages the results", () => {
      const result = Tyneq.from([5, 3, 1, 4, 2])
        .orderBy(x => x)
        .skip(1)
        .take(3)
        .toArray();
      expect(result).toEqual([2, 3, 4]);
    });

    it("handles skip beyond sorted length gracefully", () => {
      const result = Tyneq.from([3, 1, 2])
        .orderBy(x => x)
        .skip(100)
        .take(5)
        .toArray();
      expect(result).toEqual([]);
    });
  });

  describe("from → groupBy → complex result", () => {
    it("groups elements and projects key/values", () => {
      const result = Tyneq.from(["apple", "avocado", "banana", "blueberry", "cherry"])
        .groupBy(
          x => x[0],
          x => x,
          (key, values) => ({ letter: key, words: values.toArray() })
        )
        .orderBy(x => x.letter)
        .toArray();

      expect(result).toEqual([
        { letter: "a", words: ["apple", "avocado"] },
        { letter: "b", words: ["banana", "blueberry"] },
        { letter: "c", words: ["cherry"] },
      ]);
    });

    it("counts items per group", () => {
      const result = Tyneq.from([1, 2, 3, 4, 5, 6])
        .groupBy(
          x => x % 2 === 0 ? "even" : "odd",
          x => x,
          (key, values) => ({ parity: key, count: values.count() })
        )
        .orderBy(x => x.parity)
        .toArray();

      expect(result).toEqual([
        { parity: "even", count: 3 },
        { parity: "odd", count: 3 },
      ]);
    });
  });

  describe("from → select → where → sum", () => {
    it("transforms then filters then sums", () => {
      const result = Tyneq.from([1, 2, 3, 4, 5])
        .select(x => x * 2)
        .where(x => x > 4)
        .sum(x => x);
      expect(result).toBe(24); // 6 + 8 + 10
    });

    it("returns 0 when no elements survive the filter", () => {
      const result = Tyneq.from([1, 2, 3])
        .select(x => x * 2)
        .where(x => x > 100)
        .sum(x => x);
      expect(result).toBe(0);
    });
  });

  describe("from → chunk → select(arr => arr.length) → toArray", () => {
    it("all but the last chunk have the specified size", () => {
      const chunkSize = 3;
      const source = [1, 2, 3, 4, 5, 6, 7];
      const lengths = Tyneq.from(source)
        .chunk(chunkSize)
        .select(arr => arr.length)
        .toArray();

      expect(lengths).toEqual([3, 3, 1]);
      // all except the last should equal chunkSize
      lengths.slice(0, -1).forEach(len => expect(len).toBe(chunkSize));
    });

    it("single chunk when sequence length equals chunk size", () => {
      const lengths = Tyneq.from([1, 2, 3])
        .chunk(3)
        .select(arr => arr.length)
        .toArray();
      expect(lengths).toEqual([3]);
    });
  });

  describe("from → selectMany → distinct → orderBy → toArray", () => {
    it("flattens, deduplicates, and sorts", () => {
      const result = Tyneq.from([[3, 1, 2], [2, 4, 1], [5]])
        .selectMany(x => x)
        .distinct()
        .orderBy(x => x)
        .toArray();
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("returns empty when all sources are empty arrays", () => {
      const result = Tyneq.from<number[]>([[], [], []])
        .selectMany(x => x)
        .distinct()
        .orderBy(x => x)
        .toArray();
      expect(result).toEqual([]);
    });
  });

  describe("complex data transformation", () => {
    interface Student {
      name: string;
      score: number;
    }

    const students: Student[] = [
      { name: "Alice", score: 85 },
      { name: "Bob", score: 42 },
      { name: "Carol", score: 91 },
      { name: "Dave", score: 55 },
      { name: "Eve", score: 78 },
    ];

    it("computes average score of students above a threshold", () => {
      const threshold = 60;
      const aboveThreshold = Tyneq.from(students)
        .where(s => s.score > threshold)
        .toArray();

      const total = Tyneq.from(aboveThreshold).sum(s => s.score);
      const average = total / aboveThreshold.length;

      // Alice(85), Carol(91), Eve(78) all exceed 60; average = (85+91+78)/3 = 84.666...
      expect(aboveThreshold.length).toBe(3);
      expect(average).toBeCloseTo(84.667, 2);
    });

    it("finds names of top-scoring students in alphabetical order", () => {
      const topScoreThreshold = 80;
      const result = Tyneq.from(students)
        .where(s => s.score >= topScoreThreshold)
        .orderBy(s => s.name)
        .select(s => s.name)
        .toArray();

      expect(result).toEqual(["Alice", "Carol"]);
    });

    it("sums scores using pipeline chaining", () => {
      const total = Tyneq.from(students).sum(s => s.score);
      expect(total).toBe(351); // 85+42+91+55+78
    });
  });

  describe("re-iterability", () => {
    it("a chained sequence can be iterated twice and yields same results", () => {
      const query = Tyneq.from([1, 2, 3, 4, 5])
        .where(x => x % 2 !== 0)
        .select(x => x * 10);

      const firstPass = query.toArray();
      const secondPass = query.toArray();

      expect(firstPass).toEqual([10, 30, 50]);
      expect(secondPass).toEqual([10, 30, 50]);
    });

    it("count and toArray on same query yield consistent results", () => {
      const query = Tyneq.from([10, 20, 30, 40])
        .where(x => x > 15);

      expect(query.count()).toBe(3);
      expect(query.toArray()).toEqual([20, 30, 40]);
      expect(query.count()).toBe(3);
    });

    it("a pipeline with orderBy can be iterated multiple times", () => {
      const query = Tyneq.from([3, 1, 2]).orderBy(x => x);

      expect(query.toArray()).toEqual([1, 2, 3]);
      expect(query.toArray()).toEqual([1, 2, 3]);
    });
  });
});
