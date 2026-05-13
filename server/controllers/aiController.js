import AIConversation from "../models/AIConversation.js";

// AI Chat Controller using OpenRouter API
export const chatWithAI = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.json({ success: false, message: "Message is required" });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        user: userId,
      });
    }

    if (!conversation) {
      // Create new conversation with first message as title
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;
      conversation = await AIConversation.create({
        user: userId,
        title: title,
        messages: [],
      });
    }

    // Build messages array for OpenRouter API
    const messages = [
      {
        role: "system",
        content:
          "Bạn là một trợ lý AI thân thiện và hữu ích. Hãy trả lời bằng tiếng Việt khi người dùng hỏi bằng tiếng Việt.",
      },
      ...conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // Call OpenRouter API
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "PingUp Social Network",
        },
        body: JSON.stringify({
          model: "tngtech/deepseek-r1t2-chimera:free",
          messages: messages,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenRouter API error");
    }

    const aiResponse = data.choices[0]?.message?.content || "Không có phản hồi";

    // Save messages to conversation
    conversation.messages.push(
      { role: "user", content: message },
      { role: "assistant", content: aiResponse }
    );
    await conversation.save();

    res.json({
      success: true,
      message: aiResponse,
      conversationId: conversation._id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("AI Chat Error:", error);

    let errorMessage = "Đã xảy ra lỗi khi kết nối với AI";
    const errMsg = error.message || error.toString();

    if (errMsg.includes("429") || errMsg.includes("rate")) {
      errorMessage = "AI đang bận, vui lòng thử lại sau";
    } else if (errMsg.includes("401") || errMsg.includes("unauthorized")) {
      errorMessage = "API key không hợp lệ";
    } else if (errMsg.includes("404")) {
      errorMessage = "Model AI không khả dụng";
    } else {
      errorMessage = errMsg;
    }

    res.json({ success: false, message: errorMessage });
  }
};

// Get all conversations for user
export const getConversations = async (req, res) => {
  try {
    const { userId } = req.auth();
    const conversations = await AIConversation.find({ user: userId })
      .select("_id title createdAt updatedAt")
      .sort({ updatedAt: -1 });

    res.json({ success: true, conversations });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get single conversation with messages
export const getConversation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { conversationId } = req.params;

    const conversation = await AIConversation.findOne({
      _id: conversationId,
      user: userId,
    });

    if (!conversation) {
      return res.json({ success: false, message: "Conversation not found" });
    }

    res.json({ success: true, conversation });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Create new conversation
export const createConversation = async (req, res) => {
  try {
    const { userId } = req.auth();

    const conversation = await AIConversation.create({
      user: userId,
      title: "Cuộc trò chuyện mới",
      messages: [],
    });

    res.json({ success: true, conversation });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete conversation
export const deleteConversation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { conversationId } = req.params;

    await AIConversation.findOneAndDelete({
      _id: conversationId,
      user: userId,
    });

    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Rename conversation
export const renameConversation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { conversationId } = req.params;
    const { title } = req.body;

    const conversation = await AIConversation.findOneAndUpdate(
      { _id: conversationId, user: userId },
      { title },
      { new: true }
    );

    if (!conversation) {
      return res.json({ success: false, message: "Conversation not found" });
    }

    res.json({ success: true, conversation });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
