import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { PlayerApi } from "@eidolon-labs/player-sdk";
import dotenv from "dotenv";
import { randomUUID } from 'crypto';
import { encodeFunctionData, parseAbi } from 'viem';
dotenv.config({ path: "../.env" });

const abi = [
  {
      "type": "function",
      "name": "move",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
  }
];

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("Missing API Key");
}

const playerApi = new PlayerApi({
  region: "us-east-2",
  apiKey: API_KEY
});

const app = new Hono()

app.post('/create-player', async (c) => {
  const player = await playerApi.createPlayer({
    chainName: "nebula-testnet",
    suppliedId: randomUUID()
  });
  console.log("Player: ", player);

  return c.json({
    player
  });
});

app.post("/send-tx", async (c) => {
  const body = await c.req.json() as {
    playerId: string;
  };
  console.log("Body: ", body);
  const tx = await playerApi.sendTransaction({
    chainName: "nebula-testnet",
    playerId: body.playerId,
    data: encodeFunctionData({
      abi,
      functionName: "move",
      args: []
    }),
    to: "0x16378Cb38F5D153f63019C1Bd2297b585dE0f44C"
  });

  return c.json({
    tx
  });
})

app.get("/player/:id", async(c) => {
  const id = c.req.param("id");
  const player = await playerApi.getPlayer({ playerId: id });
  return c.json({ player });
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
