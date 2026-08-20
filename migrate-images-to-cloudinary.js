/**
 * migrate-images-to-cloudinary.js
 * -----------------------------------------------------------------------
 * ONE-TIME script. Run this on your LOCAL machine (jahan backend/uploads/
 * folder mein purani images physically maujood hain).
 *
 * Ye script:
 *  1. backend/uploads/ folder ki har image Cloudinary par upload karta hai
 *  2. MongoDB ke HAR collection ke HAR document mein jahan bhi purana
 *     "http://localhost:5000/uploads/<filename>" (ya kisi bhi host ka
 *     "/uploads/<filename>") URL milta hai, use naye Cloudinary URL se
 *     replace kar deta hai — Post.featuredImage, Post.content ke andar
 *     embedded <img> tags, WebStory.images[], sabme kaam karega, chahe
 *     schema field ka naam kuch bhi ho (generic/recursive replace hai).
 *
 * SETUP (chalane se pehle):
 *   1. backend folder ke andar hi ye file rakho (jahan uploads/ folder hai)
 *   2. npm install mongodb cloudinary dotenv
 *   3. .env mein ye 4 values already honi chahiye (jo Cloudinary setup
 *      mein use ki thi + apni Mongo Atlas connection string):
 *        MONGO_URI=...
 *        CLOUDINARY_CLOUD_NAME=...
 *        CLOUDINARY_API_KEY=...
 *        CLOUDINARY_API_SECRET=...
 *   4. Run: node migrate-images-to-cloudinary.js
 *
 * Script sirf READ karta hai local files ko (delete nahi karta), aur
 * MongoDB mein sirf un fields ko update karta hai jinme purana
 * localhost/uploads URL mila ho. Chalane se pehle DB ka ek backup/export
 * le lena acchi practice hai (mongodump ya Atlas se export).
 * -----------------------------------------------------------------------
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const { v2: cloudinary } = require("cloudinary");

const UPLOADS_DIR = path.join(__dirname, "uploads");
const CLOUDINARY_FOLDER = "filmycharcha-uploads";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Regex jo kisi bhi host ke "/uploads/<filename>" pattern ko pakadta hai
// e.g. http://localhost:5000/uploads/foo.jpg  ya  https://xyz.vercel.app/uploads/foo.jpg
const OLD_URL_REGEX = /https?:\/\/[^\/\s"'<>]+\/uploads\/([^\s"'<>]+)/g;

async function uploadAllLocalImages() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    throw new Error(`uploads/ folder nahi mila at: ${UPLOADS_DIR}`);
  }

  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => {
    const full = path.join(UPLOADS_DIR, f);
    return fs.statSync(full).isFile();
  });

  console.log(`Found ${files.length} local files in uploads/. Uploading to Cloudinary...`);

  const filenameToNewUrl = new Map(); // key: decoded filename -> value: cloudinary secure_url

  for (const file of files) {
    const fullPath = path.join(UPLOADS_DIR, file);
    try {
      const result = await cloudinary.uploader.upload(fullPath, {
        folder: CLOUDINARY_FOLDER,
        use_filename: true,
        unique_filename: false,
      });
      filenameToNewUrl.set(file, result.secure_url);
      console.log(`  ✔ uploaded: ${file} -> ${result.secure_url}`);
    } catch (err) {
      console.error(`  ✘ FAILED to upload ${file}:`, err.message);
    }
  }

  return filenameToNewUrl;
}

// Recursively string values ke andar old URLs dhoondh kar replace karta hai.
// Returns { value, changed }
function replaceUrlsInValue(value, filenameToNewUrl, unmatched) {
  if (typeof value === "string") {
    let changed = false;
    const newValue = value.replace(OLD_URL_REGEX, (match, rawFilename) => {
      let filename;
      try {
        filename = decodeURIComponent(rawFilename);
      } catch {
        filename = rawFilename;
      }

      // Cloudinary/local filenames may have spaces encoded differently; try both.
      const candidate =
        filenameToNewUrl.get(filename) ||
        filenameToNewUrl.get(rawFilename) ||
        filenameToNewUrl.get(filename.replace(/ /g, "_")) ||
        null;

      if (candidate) {
        changed = true;
        return candidate;
      }
      unmatched.add(filename);
      return match; // no match found, leave as-is
    });
    return { value: newValue, changed };
  }

  if (Array.isArray(value)) {
    let changedAny = false;
    const newArr = value.map((item) => {
      const { value: v, changed } = replaceUrlsInValue(item, filenameToNewUrl, unmatched);
      if (changed) changedAny = true;
      return v;
    });
    return { value: newArr, changed: changedAny };
  }

  if (value && typeof value === "object") {
    let changedAny = false;
    const newObj = {};
    for (const key of Object.keys(value)) {
      // don't touch Mongo internal fields like _id
      if (key === "_id") {
        newObj[key] = value[key];
        continue;
      }
      const { value: v, changed } = replaceUrlsInValue(value[key], filenameToNewUrl, unmatched);
      if (changed) changedAny = true;
      newObj[key] = v;
    }
    return { value: newObj, changed: changedAny };
  }

  return { value, changed: false };
}

async function migrateMongo(filenameToNewUrl) {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db(); // uses DB name from the connection string

  const collections = await db.listCollections().toArray();
  const unmatched = new Set();
  let totalUpdated = 0;

  for (const { name: collName } of collections) {
    if (collName.startsWith("system.")) continue;

    const coll = db.collection(collName);
    const docs = await coll.find({}).toArray();

    for (const doc of docs) {
      const { value: newDoc, changed } = replaceUrlsInValue(doc, filenameToNewUrl, unmatched);
      if (changed) {
        const { _id, ...rest } = newDoc;
        await coll.updateOne({ _id: doc._id }, { $set: rest });
        totalUpdated++;
        console.log(`  ✔ updated ${collName} document ${doc._id}`);
      }
    }
  }

  await client.close();

  console.log(`\nTotal documents updated: ${totalUpdated}`);
  if (unmatched.size) {
    console.log(`\n⚠ Ye filenames DB mein referenced the lekin local uploads/ folder mein nahi mile (in URLs ko manually check karna padega):`);
    for (const f of unmatched) console.log(`   - ${f}`);
  }
}

(async () => {
  try {
    const filenameToNewUrl = await uploadAllLocalImages();
    console.log("\nAb MongoDB documents update kar rahe hain...\n");
    await migrateMongo(filenameToNewUrl);
    console.log("\n✅ Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
})();