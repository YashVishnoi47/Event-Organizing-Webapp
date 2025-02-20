"use server";
import { revalidatePath } from "next/cache";
import { connectDb } from "../mongodb";
import User from "../mongodb/models/user.model";
import Event from "../mongodb/models/event.model";
import { handleError } from "../utils";
// Hande error from utils

// Create User function
export async function createUser(user) {
  try {
    await connectDb();

    const newUser = await User.create(user);
    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    handleError(error);
  }
}

// Get User by id
export async function getUserbyId(userId) {
  try {
    await connectDb();
    const user = await User.findById(userId);

    if (!user) throw new Error("User not found");

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    handleError(error);
  }
}

// Upate User Function
export async function updateUser(clerkId, user) {
  try {
    await connectDb();

    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, {
      new: true,
    });

    if (!updatedUser) throw new Error("user update failed");

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
}

// Delete User Function
export async function deleteUser(clerkId) {
  try {
    await connectDb();

    // Find user to delete
    const userToDelete = await User.findOne({ clerkId });

    if (!userToDelete) {
      throw new Error("User not found");
    }

    // Unlink relationships
    await Promise.all([
      // Update the 'events' collection to remove references to the user
      Event.updateMany(
        { _id: { $in: userToDelete.events } },
        { $pull: { organizer: userToDelete._id } }
      ),

      // Update the 'orders' collection to remove references to the user
      // Order.updateMany(
      //   { _id: { $in: userToDelete.orders } },
      //   { $unset: { buyer: 1 } }
      // ),
    ]);

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userToDelete._id);
    revalidatePath("/");

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
  } catch (error) {
    handleError(error);
  }
}

export async function buyTicket(userId, eventId) {
  try {
    await connectDb();

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { ticket: eventId } },
      { new: true }
    );

    if (!user) throw new Error("User not found");

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.log("User Action Ticket Error",error);
  }
}
