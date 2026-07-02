ALTER TABLE "public"."AdminUser"
ADD COLUMN "mfaSecretCiphertext" TEXT,
ADD COLUMN "mfaEnabledAt" TIMESTAMP(3);
