async function testSarvam() {
  console.log("Testing Sarvam...");
  const ttsResponse = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': 'sk_is9hzfwk_EuLpgNMcBQ7XC9LzKhfcYsHl',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: ["Hello"],
      target_language_code: "en-IN",
      speaker: "meera",
      model: "bulbul:v1",
      speech_sample_rate: 8000
    })
  });
  console.log("Sarvam status:", ttsResponse.status);
  const text = await ttsResponse.text();
  console.log("Sarvam response:", text.substring(0, 100));
}

async function testSarvamV1() {
  console.log("Testing Sarvam V1 endpoint...");
  const ttsResponse = await fetch('https://api.sarvam.ai/v1/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': 'sk_is9hzfwk_EuLpgNMcBQ7XC9LzKhfcYsHl',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: ["Hello"],
      target_language_code: "en-IN",
      speaker: "meera",
      model: "bulbul:v1",
      speech_sample_rate: 8000
    })
  });
  console.log("Sarvam V1 status:", ttsResponse.status);
  const text = await ttsResponse.text();
  console.log("Sarvam V1 response:", text.substring(0, 100));
}

async function testSarvamCurrentCode() {
  console.log("Testing Sarvam Current Code...");
  const ttsResponse = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': 'sk_is9hzfwk_EuLpgNMcBQ7XC9LzKhfcYsHl',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "Hello",
      target_language_code: "en-IN",
      model: "bulbul:v3",
      speaker: "meera",
      speech_sample_rate: 24000
    })
  });
  console.log("Sarvam Current Code status:", ttsResponse.status);
  const text = await ttsResponse.text();
  console.log("Sarvam Current Code response:", text.substring(0, 100));
}

async function testSarvamCurrentCodeV1() {
  console.log("Testing Sarvam Current Code V1...");
  const ttsResponse = await fetch('https://api.sarvam.ai/v1/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': 'sk_is9hzfwk_EuLpgNMcBQ7XC9LzKhfcYsHl',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "Hello",
      target_language_code: "en-IN",
      model: "bulbul:v3",
      speaker: "meera",
      speech_sample_rate: 24000
    })
  });
  console.log("Sarvam Current Code V1 status:", ttsResponse.status);
  const text = await ttsResponse.text();
  console.log("Sarvam Current Code V1 response:", text.substring(0, 100));
}

async function testElevenLabs() {
  console.log("\nTesting ElevenLabs...");
  const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
    method: 'POST',
    headers: {
      'xi-api-key': 'sk_33a9fa989ea578a739bc8cb35aafb1f7191fff2466a86366',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "Hello",
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });
  console.log("ElevenLabs status:", ttsResponse.status);
  if (!ttsResponse.ok) {
    console.log("ElevenLabs response:", await ttsResponse.text());
  } else {
    console.log("ElevenLabs response size:", (await ttsResponse.blob()).size);
  }
}

async function run() {
  await testSarvam();
  await testSarvamV1();
  await testSarvamCurrentCode();
  await testSarvamCurrentCodeV1();
  await testElevenLabs();
}
run();
