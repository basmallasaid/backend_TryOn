const { CONFIG } = require("../config/api");

const KIE_API_BASE = CONFIG.KIE_API_BASE;

const generateAvatarImage = async (prompt, apiKey) => {
  if (!apiKey) {
    throw new Error("KIE API key is required");
  }

  const model = CONFIG.KIE_TTI_MODEL;
  if (!model) {
    throw new Error(
      "KIE TTI model is not configured. Set KIE_TTI_MODEL in src/config/api.js"
    );
  }

  const taskId = await createTask(prompt, model, apiKey);
  const result = await pollTask(taskId, apiKey);

  return result.imageUrl;
};

const createTask = async (prompt, model, apiKey) => {
  const res = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: {
        prompt,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Task creation failed (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();

  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`Task creation failed: ${data.msg || "Unknown error"}`);
  }

  return data.data.taskId;
};

const pollTask = async (taskId, apiKey, maxAttempts = 60, interval = 3000) => {
  let attempt = 0;

  while (attempt < maxAttempts) {
    const res = await fetch(
      `${KIE_API_BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Status check failed (${res.status}): ${errText || res.statusText}`);
    }

    const data = await res.json();

    if (data.code !== 200) {
      throw new Error(`Status check failed: ${data.msg || "Unknown error"}`);
    }

    const state = data.data.state;

    if (state === "success") {
      const resultJson = JSON.parse(data.data.resultJson || "{}");
      const resultUrls = resultJson.resultUrls || [];

      if (!resultUrls.length) {
        throw new Error("Generation completed but no result URL was returned");
      }

      return {
        imageUrl: resultUrls[0],
        metadata: {
          taskId,
          costTime: data.data.costTime,
          model: data.data.model,
          creditsConsumed: data.data.creditsConsumed,
        },
      };
    }

    if (state === "fail") {
      throw new Error(
        `Generation failed: ${data.data.failMsg || "Unknown error"}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
    attempt++;
  }

  const seconds = Math.round((maxAttempts * interval) / 1000);
  throw new Error(
    `Generation timed out after ${seconds} seconds. Please try again.`
  );
};

module.exports = { generateAvatarImage };
