import mongoose from "mongoose";

const QuizRoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },

    problems: [
      {
        title: String,
        description: String,
        options: [
          {
            id: Number,
            title: String,
          },
        ],
        answer: Number,
      },
    ],

    players: [
      {
        name: String,
        points: Number,
        stage: Number,
      },
    ],
  },
  { timestamps: true }
);

export const QuizRoom = mongoose.model("QuizRoom", QuizRoomSchema);
