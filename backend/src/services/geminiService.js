// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// const GEMINI_API_URL =
//   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// async function generateReview(prompt) {
//   if (!GEMINI_API_KEY) {
//     throw new Error("GEMINI_API_KEY missing in .env");
//   }

//   const payload = {
//     contents: [
//       {
//         role: "user",
//         parts: [{ text: prompt }],
//       },
//     ],
//     generationConfig: {
//       temperature: 0.2,
//       maxOutputTokens: 2500,
//     },
//   };

//   const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });

//   if (!response.ok) {
//     const text = await response.text();
//     throw new Error(`Gemini API error ${response.status}: ${text}`);
//   }

//   const data = await response.json();

//   const review = data?.candidates?.[0]?.content?.parts?.[0]?.text;

//   if (!review) {
//     throw new Error("Empty Gemini response");
//   }

//   return review;
// }

// module.exports = { generateReview };











const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function generateReview(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing in .env");
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.15, // ⬅️ slightly lower = less random cut
      maxOutputTokens: 2000, // ⬅️ extra buffer
      topP: 0.9,
      topK: 40,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  const review = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!review || review.trim().length < 50) {
    throw new Error("Gemini response too short or incomplete");
  }

  return review.trim();
}

module.exports = { generateReview };
