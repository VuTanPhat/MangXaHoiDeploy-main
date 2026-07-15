import User from "../models/User.js";

const getPrimaryEmail = (clerkUser) => {
  const emails = clerkUser.emailAddresses || clerkUser.email_addresses || [];
  const primaryEmailId =
    clerkUser.primaryEmailAddressId || clerkUser.primary_email_address_id;
  const primaryEmail = emails.find((email) => email.id === primaryEmailId);

  return (
    primaryEmail?.emailAddress ||
    primaryEmail?.email_address ||
    emails[0]?.emailAddress ||
    emails[0]?.email_address ||
    ""
  );
};

const buildFullName = (clerkUser, email) => {
  const firstName = clerkUser.firstName || clerkUser.first_name || "";
  const lastName = clerkUser.lastName || clerkUser.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || clerkUser.username || email.split("@")[0] || "New User";
};

const buildUniqueUsername = async (baseUsername, userId) => {
  const cleanBase =
    baseUsername
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "user";

  let username = cleanBase;
  let suffix = 0;

  while (await User.findOne({ username, _id: { $ne: userId } })) {
    suffix += 1;
    username = `${cleanBase}${suffix}`;
  }

  return username;
};

export const syncClerkUserToDatabase = async (clerkUser) => {
  const userId = clerkUser.id;
  const email = getPrimaryEmail(clerkUser);

  if (!userId || !email) {
    throw new Error("Missing Clerk user id or email");
  }

  const existingUser = await User.findById(userId);
  const fullName = buildFullName(clerkUser, email);
  const baseUsername = clerkUser.username || email.split("@")[0];

  const userData = {
    email,
    full_name: fullName,
    profile_picture: clerkUser.imageUrl || clerkUser.image_url || "",
  };

  if (!existingUser) {
    userData._id = userId;
    userData.username = await buildUniqueUsername(baseUsername, userId);
    return User.create(userData);
  }

  return User.findByIdAndUpdate(userId, userData, { new: true });
};
