"use server";

import { getCurrentUserId } from "@/lib/auth";
import { addCredits, deductCredits } from "@/lib/credits";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function createRazorpayOrder(amountUsd: number, packName: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Convert USD to INR (approximate 83 INR per USD) and then to paise
  const amountInr = Math.round(amountUsd * 83);
  const amountPaise = amountInr * 100;

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId,
        packName,
      },
    });

    return { success: true, order };
  } catch (err: any) {
    console.error("[SHOP] Order creation failed:", err);
    return { success: false, error: "Failed to create order" };
  }
}

export async function verifyRazorpayPayment(
  razorpay_payment_id: string,
  razorpay_order_id: string,
  razorpay_signature: string,
  creditsToAdd: number
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return { success: false, error: "Invalid payment signature" };
  }

  // Add credits to user
  const result = await addCredits(userId, creditsToAdd, `Shop purchase: ${creditsToAdd} credits`);
  
  if (!result.success) {
    return { success: false, error: "Failed to add credits to your account" };
  }

  return { success: true };
}

export async function openLuckyDrop() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const COST = 50;

  // Deduct cost
  const deductResult = await deductCredits(userId, COST);
  if (!deductResult.success) {
    return { success: false, error: "Insufficient credits to open Lucky Drop." };
  }

  // Random logic
  const rand = Math.random();
  let rarity: 'common' | 'epic' | 'legendary' = 'common';
  let creditsWon = 0;

  if (rand < 0.02) {
    // 2% chance for rare drop (epic/legendary)
    const rareRand = Math.random();
    if (rareRand < 0.01) {
      // 1% inside rare -> 500
      rarity = 'legendary';
      creditsWon = 500;
    } else if (rareRand < 0.06) {
      // 5% inside rare -> 200
      rarity = 'epic';
      creditsWon = 200;
    } else {
      // remaining 94% inside rare -> 50-199
      rarity = 'epic';
      creditsWon = Math.floor(Math.random() * (199 - 50 + 1)) + 50;
    }
  } else {
    // 98% normal drop
    rarity = 'common';
    // Small reward: 0 to 30 credits (so it averages around 15, making it a "loss" normally)
    creditsWon = Math.floor(Math.random() * 31); 
  }

  // Add won credits (as permanent lifetime credits!)
  if (creditsWon > 0) {
    await addCredits(userId, creditsWon, `Lucky Drop Win (${rarity})`);
  }

  return { 
    success: true, 
    rarity, 
    creditsWon 
  };
}
