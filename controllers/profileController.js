const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { bucket } = require("../firebase-config"); // Mengimpor Firebase Storage bucket
const multer = require("multer"); // Digunakan untuk menangani file upload

// Setup multer untuk menangani upload file gambar di memori
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * 1. ENDPOINT POST: Upload Foto Profil
 *    - Mengambil file dari field `profilePicture`.
 *    - Mengunggah ke Firebase Storage.
 *    - Menyimpan URL foto ke dalam tabel `UserProfile`.
 */
const uploadProfilePicture = async (req, res) => {
  const userId = req.user.userId; // Diperoleh dari authMiddleware

  if (!req.file) {
    return res.status(400).json({ msg: "No file uploaded" });
  }

  try {
    // Mempersiapkan unggahan ke Firebase Storage
    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    // Upload file ke Firebase Storage
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Event ketika upload selesai
    stream.on("finish", async () => {
      try {
        // Dapatkan Signed URL agar file bisa diakses
        const [url] = await fileUpload.getSignedUrl({
          action: "read",
          expires: "03-01-2500", // Tanggal kedaluwarsa link
        });

        // Mencari apakah userProfile sudah ada
        let userProfile = await prisma.userProfile.findUnique({
          where: { userId },
        });

        // Jika belum ada, buat baru
        if (!userProfile) {
          userProfile = await prisma.userProfile.create({
            data: {
              userId,
              profilePicture: url,
            },
          });
        } else {
          // Jika sudah ada, update saja
          userProfile = await prisma.userProfile.update({
            where: { userId },
            data: {
              profilePicture: url,
            },
          });
        }

        return res.status(200).json({
          msg: "Profile picture uploaded successfully",
          userProfile: {
            profilePicture: userProfile.profilePicture,
          },
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
 * 2. ENDPOINT PUT: Update profil pengguna (fullName, phoneNumber, address, dsb.)
 */
const updateProfile = async (req, res) => {
  const { fullName, phoneNumber, address } = req.body;
  const userId = req.user.userId; // Pastikan authMiddleware mengatur userId

  try {
    // Mencari profil user berdasarkan userId
    let userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // Jika profil belum ada, buat profil baru
    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          userId,
          fullName,
          phoneNumber,
          address,
        },
      });
    } else {
      // Jika profil sudah ada, update profil yang ada
      userProfile = await prisma.userProfile.update({
        where: { userId },
        data: {
          fullName,
          phoneNumber,
          address,
        },
      });
    }

    res.status(200).json({
      msg: "Profile updated successfully",
      userProfile: {
        fullName: userProfile.fullName,
        phoneNumber: userProfile.phoneNumber,
        address: userProfile.address,
        profilePicture: userProfile.profilePicture || "",
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

/**
 * 3. ENDPOINT GET: Mendapatkan profil pengguna
 */
const getProfile = async (req, res) => {
  const userId = req.user.userId; // Pastikan authMiddleware mengatur userId

  try {
    // Mencari profil user berdasarkan userId
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // Jika profil tidak ada, kirimkan data kosong (null atau string kosong)
    res.status(200).json({
      msg: "Profile retrieved successfully",
      userProfile: userProfile
        ? {
            profilePicture: userProfile.profilePicture || "",
            fullName: userProfile.fullName || "",
            phoneNumber: userProfile.phoneNumber || "",
            address: userProfile.address || "",
          }
        : { profilePicture: "", fullName: "", phoneNumber: "", address: "" },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const deleteProfilePicture = async (req, res) => {
  const userId = req.user.userId; // userId dari JWT
  try {
    // Mencari profil user
    let userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile || !userProfile.profilePicture) {
      // Jika userProfile tidak ada atau profilePicture kosong
      return res.status(404).json({
        msg: "No profile picture found to delete",
      });
    }

    // Mendapatkan URL yang tersimpan
    const fileUrl = userProfile.profilePicture;

    // Mengambil nama file dari URL (bagian terakhir path sebelum query param '?')
    const decodedUrl = decodeURIComponent(fileUrl);
    const filePathWithoutQuery = decodedUrl.split("?")[0];
    const fileName = filePathWithoutQuery.split("/").pop();

    // Menghapus file di Firebase Storage
    await bucket.file(fileName).delete();

    // Set profilePicture menjadi kosong di database
    userProfile = await prisma.userProfile.update({
      where: { userId },
      data: { profilePicture: "" },
    });

    return res.status(200).json({
      msg: "Profile picture deleted successfully",
      userProfile: {
        profilePicture: userProfile.profilePicture,
      },
    });
  } catch (err) {
    console.error("Error deleting profile picture:", err);
    return res.status(500).json({
      msg: "Server error while deleting profile picture",
    });
  }
};

module.exports = {
  upload,
  uploadProfilePicture,
  updateProfile,
  getProfile,
  deleteProfilePicture,
};
