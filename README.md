# SCP-294: A.I. Powered Interactive Coffee Machine

A full-stack interactive narrative project based on the SCP Foundation's SCP-294. The core feature of this project is to leverage generative AI to dynamically produce in-universe experiment documentation based on user input.

---

### ✨ Key Features

* **Interactive Narrative Flow**: Players assume the role of a researcher, interacting with SCP-294 through a guided narrative, creating a unique "experiment" each time.
* **A.I. Semantic Interpretation**: The backend utilizes advanced **Prompt Engineering** with the **Google Gemini API** to interpret abstract user requests and generate detailed, lore-friendly experiment logs.
* **Session-level State Management**: Global game variables like the researcher's name and ID verification status are maintained across different pages using **Pinia** for a seamless user experience.
* **Data Persistence**: All experiment results are stored in a **MongoDB Atlas** cloud database, accessible from a dedicated "Records" page.

### 💻 Tech Stack

* **Frontend**: **Vue 3** (Composition API), **Vue Router** (for navigation), **Pinia** (for global state management), **HTML/CSS** (for UI design).
* **Backend**: **Node.js** & **Vercel Serverless Functions** (for a lightweight, secure backend), **MongoDB** (for data storage), **Google Gemini API** (for AI content generation).

---

### 🚀 How to Run

**Live Demo**

[Click here to experience the project](https://scp-294-g8vw5dcsx-leavys-projects-e328e1bd.vercel.app)

**Local Development**

Clone the repository: `git clone https://github.com/Wx457/SCP-294`