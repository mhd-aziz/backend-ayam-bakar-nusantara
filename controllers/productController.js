const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { bucket } = require("../firebase-config"); // Pastikan Firebase Admin SDK sudah diatur
const multer = require("multer");

// Setup multer untuk menangani upload file gambar di memori
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * 1. CREATE: Menambahkan Produk Baru dengan Upload Foto Produk ke Firebase
 */
// CREATE: Menambahkan Produk Baru dengan Upload Foto Produk ke Firebase
const createProduct = async (req, res) => {
  const { productName, category, productPrice } = req.body;
  const userIdFromToken = req.user.userId; // userId from JWT

  if (!req.file) {
    return res.status(400).json({ msg: "No file uploaded" });
  }

  try {
    const seller = await prisma.seller.findUnique({
      where: { userId: userIdFromToken },
    });

    if (!seller) {
      return res.status(404).json({ msg: "Seller not found" });
    }

    // Format sellerId as "Seller-{id}"
    const formattedSellerId = `Seller-${seller.id}`;

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
          expires: "03-01-2500",
        });

        const parsedProductPrice = parseFloat(productPrice);

        // Store product with the formatted sellerId
        const newProduct = await prisma.product.create({
          data: {
            productName,
            category,
            productImage: url,
            productPrice: parsedProductPrice,
            sellerId: formattedSellerId, // Use formatted sellerId
          },
        });

        return res.status(201).json({
          msg: "Product created successfully",
          product: newProduct,
        });
      } catch (error) {
        console.error(error.message);
        return res.status(500).json({ msg: "Error processing uploaded file" });
      }
    });

    stream.on("error", (err) => {
      console.error("Upload error:", err);
      return res.status(500).json({ msg: "Error uploading file" });
    });

    stream.end(file.buffer);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * 2. UPDATE: Mengupdate Produk dengan Upload Foto Produk ke Firebase
 */
const updateProduct = async (req, res) => {
  const { id, productName, category, productPrice } = req.body;
  const sellerIdFromToken = req.user.userId; // sellerId from JWT

  let productImage = req.body.productImage; // If no new image is uploaded, keep the old product image

  // Convert the `id` from string to integer to match the Prisma schema
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return res.status(400).json({ msg: "Invalid product ID" });
  }

  try {
    // 1. Get seller details based on sellerId (formatted as Seller-{sellerId})
    const seller = await prisma.seller.findUnique({
      where: { userId: sellerIdFromToken },
    });

    if (!seller) {
      return res.status(404).json({ msg: "Seller not found" });
    }

    const formattedSellerId = `Seller-${seller.id}`;

    // 2. If there is a new product image to upload, handle the file upload to Firebase
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
          // Get signed URL for the uploaded image
          const [url] = await fileUpload.getSignedUrl({
            action: "read",
            expires: "03-01-2500", // Expiration date for URL
          });

          productImage = url; // Update productImage with the new URL

          // 3. Proceed with the product update
          let product = await prisma.product.findUnique({
            where: { id: parsedId }, // Use the parsed integer id
          });

          if (!product) {
            return res.status(404).json({ msg: "Product not found" });
          }

          // Update product details
          product = await prisma.product.update({
            where: { id: parsedId }, // Use the parsed integer id
            data: {
              productName,
              category,
              productImage, // New or existing productImage
              productPrice: parseFloat(productPrice), // Ensure price is stored as float
              sellerId: formattedSellerId, // Correctly associate sellerId
            },
          });

          return res.status(200).json({
            msg: "Product updated successfully",
            product,
          });
        } catch (err) {
          console.error(err.message);
          return res
            .status(500)
            .json({ msg: "Error processing uploaded file" });
        }
      });

      // Event error upload
      stream.on("error", (err) => {
        console.error("Upload error:", err);
        return res.status(500).json({ msg: "Error uploading file" });
      });

      // Begin writing buffer to stream
      stream.end(req.file.buffer);
    } else {
      // If no new product image is uploaded, continue with the update without changing the image
      let product = await prisma.product.findUnique({
        where: { id: parsedId }, // Use the parsed integer id
      });

      if (!product) {
        return res.status(404).json({ msg: "Product not found" });
      }

      // Update product details without changing the productImage
      product = await prisma.product.update({
        where: { id: parsedId }, // Use the parsed integer id
        data: {
          productName,
          category,
          productPrice: parseFloat(productPrice), // Ensure productPrice is updated as float
          sellerId: formattedSellerId, // Ensure the correct sellerId
        },
      });

      return res.status(200).json({
        msg: "Product updated successfully",
        product,
      });
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Error updating product" });
  }
};

/**
 * 3. GET: Mendapatkan Produk berdasarkan Seller
 */
const getProducts = async (req, res) => {
  const sellerId = req.user.userId; // sellerId from JWT

  try {
    const seller = await prisma.seller.findUnique({
      where: { userId: sellerId },
    });

    if (!seller) {
      return res.status(404).json({ msg: "Seller not found" });
    }

    // Format sellerId to match what is stored in the Product model
    const formattedSellerId = `Seller-${seller.id}`;

    const products = await prisma.product.findMany({
      where: {
        sellerId: formattedSellerId, // Query using formatted sellerId
      },
    });

    if (!products || products.length === 0) {
      return res.status(404).json({ msg: "No products found" });
    }

    return res.status(200).json({
      msg: "Products retrieved successfully",
      products,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Error retrieving products" });
  }
};

/**
 * 4. DELETE: Menghapus Produk
 */
const deleteProduct = async (req, res) => {
  const { id } = req.body; // ID produk yang akan dihapus
  const sellerId = req.user.userId; // sellerId dari JWT

  // Convert id to integer to match Prisma schema
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return res.status(400).json({ msg: "Invalid product ID" });
  }

  try {
    // 1. Check if the product exists
    let product = await prisma.product.findUnique({
      where: { id: parsedId }, // Use parsedId (integer)
    });

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // 2. Ensure that the product belongs to the seller
    if (product.sellerId !== `Seller-${sellerId}`) {
      return res
        .status(403)
        .json({ msg: "Unauthorized action, not your product" });
    }

    // 3. Delete the product
    await prisma.product.delete({
      where: { id: parsedId }, // Use parsedId (integer)
    });

    return res.status(200).json({
      msg: "Product deleted successfully",
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Error deleting product" });
  }
};

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};
