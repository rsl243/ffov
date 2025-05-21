-- CreateTable
CREATE TABLE "ShippingSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "freeShippingMin" REAL NOT NULL,
    CONSTRAINT "ShippingSettings_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShippingOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "delay" TEXT NOT NULL,
    "countries" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "weightRange" TEXT,
    CONSTRAINT "ShippingOption_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingSettings_vendorId_key" ON "ShippingSettings"("vendorId");
