const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { bucket } = require("../firebase-config");
const multer = require("multer");

// Setup multer untuk menangani upload file gambar di memori
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * 1. ENDPOINT POST: Menambahkan Seller Baru dengan Upload Foto Toko ke Firebase
 */
const createSeller = async (req, res) => {
  const {
    storeName,
    storeDescription,
    storeAddress,
    storeCoordinates,
    customGoogleMapLink,
  } = req.body;
  const userId = req.user.userId; // Pastikan authMiddleware mengatur userId

  // Pastikan ada file gambar (storeImage)
  if (!req.file) {
    return res.status(400).json({ msg: "No file uploaded" });
  }

  try {
    // Mengambil file gambar dari request dan upload ke Firebase Storage
    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    stream.on("finish", async () => {
      try {
        // Mendapatkan URL gambar yang telah di-upload
        const [url] = await fileUpload.getSignedUrl({
          action: "read",
          expires: "03-01-2500", // Tanggal kedaluwarsa URL
        });

        // Menambahkan seller baru dengan URL gambar yang di-upload
        const newSeller = await prisma.seller.create({
          data: {
            sellerId: `Seller-${userId}`,
            storeName,
            storeDescription,
            storeAddress,
            storeCoordinates,
            storeImage: url, // Simpan URL gambar
            customGoogleMapLink,
            userId, // Relasi dengan AuthUser
          },
        });

        return res.status(201).json({
          msg: "Seller created successfully",
          seller: newSeller,
        });
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({ msg: "Error processing uploaded file" });
      }
    });

    // Event error upload
    stream.on("error", (err) => {
      console.error("Upload error:", err);
      return res.status(500).json({ msg: "Error uploading file" });
    });

    // Mulai menulis buffer ke stream
    stream.end(file.buffer);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * 2. ENDPOINT PUT: Mengupdate Seller berdasarkan userId dengan Upload Foto Toko ke Firebase
 */
const updateSeller = async (req, res) => {
  const {
    storeName,
    storeDescription,
    storeAddress,
    storeCoordinates,
    customGoogleMapLink,
  } = req.body;
  const userId = req.user.userId; // userId dari JWT

  // Periksa apakah ada gambar yang diupload, jika ada, upload gambar ke Firebase
  let storeImage = req.body.storeImage; // Jika sudah ada URL gambar, simpan yang baru
  if (req.file) {
    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    stream.on("finish", async () => {
      try {
        const [url] = await fileUpload.getSignedUrl({
          action: "read",
          expires: "03-01-2500", // Tanggal kedaluwarsa URL
        });

        // Jika gambar berhasil di-upload, set URL gambar baru
        storeImage = url;

        // Update seller dengan data baru
        let seller = await prisma.seller.findUnique({
          where: { userId },
        });

        if (!seller) {
          return res.status(404).json({ msg: "Seller not found" });
        }

        seller = await prisma.seller.update({
          where: { userId },
          data: {
            storeName,
            storeDescription,
            storeAddress,
            storeCoordinates,
            storeImage, // Simpan URL gambar yang baru
            customGoogleMapLink,
          },
        });

        return res.status(200).json({
          msg: "Seller updated successfully",
          seller,
        });
      } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: "Error processing uploaded file" });
      }
    });

    // Event error upload
    stream.on("error", (err) => {
      console.error("Upload error:", err);
      return res.status(500).json({ msg: "Error uploading file" });
    });

    // Mulai menulis buffer ke stream
    stream.end(req.file.buffer);
  } else {
    // Jika tidak ada gambar yang di-upload, lanjutkan dengan update data tanpa gambar
    try {
      let seller = await prisma.seller.findUnique({
        where: { userId },
      });

      if (!seller) {
        return res.status(404).json({ msg: "Seller not found" });
      }

      seller = await prisma.seller.update({
        where: { userId },
        data: {
          storeName,
          storeDescription,
          storeAddress,
          storeCoordinates,
          customGoogleMapLink,
        },
      });

      return res.status(200).json({
        msg: "Seller updated successfully",
        seller,
      });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ msg: "Error updating seller" });
    }
  }
};

/**
 * 3. ENDPOINT GET: Mendapatkan Detail Seller berdasarkan userId
 */
const getSeller = async (req, res) => {
  const userId = req.user.userId; // userId dari JWT

  try {
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      return res.status(404).json({ msg: "Seller not found" });
    }

    return res.status(200).json({
      msg: "Seller retrieved successfully",
      seller,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Error retrieving seller" });
  }
};

/**
 * 4. ENDPOINT DELETE: Menghapus Seller berdasarkan userId
 */
const deleteSeller = async (req, res) => {
  const userId = req.user.userId; // userId dari JWT

  try {
    const seller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      return res.status(404).json({ msg: "Seller not found" });
    }

    await prisma.seller.delete({
      where: { userId },
    });

    return res.status(200).json({
      msg: "Seller deleted successfully",
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Error deleting seller" });
  }
};

module.exports = {
  createSeller,
  getSeller,
  updateSeller,
  deleteSeller,
};
