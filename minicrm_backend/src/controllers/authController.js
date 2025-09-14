import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function authUser(req, res) {
  const { gId, name, email, avatar } = req.body;

  try {
    // 0. Early exit if required fields missing
    if (!gId || !name || !email) {
      return res.status(400).json({ error: "Invalid Google auth payload" });
    }

    // 1. Upsert user (insert if new, update if name/email changed)
    const user = await prisma.user.upsert({
      where: { googleId: gId },
      update: { name, email, avatar },
      create: { googleId: gId, name, email, avatar },
    });

    // 2. Respond with clean payload
    return res.status(200).json({
      googleId: user.googleId,
      email: user.email,
      name: user.name,
    });

  } catch (error) {
    console.error("Error authenticating user:", error);
    return res.status(500).json({ error: "Failed to authenticate user" });
  }
}

export async function getAuthedUser(req, res) {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}