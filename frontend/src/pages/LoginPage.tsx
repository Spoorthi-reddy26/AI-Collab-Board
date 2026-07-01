import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.message === "Login Successful") {
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("userId", String(data.userId));
        localStorage.setItem("userName", data.fullName);
        localStorage.setItem("userEmail", data.email);
        navigate("/dashboard");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Unable to connect to server");
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-96 rounded-xl bg-white p-8 shadow-xl">

        <h1 className="mb-2 text-3xl font-bold">
          CollabBoard AI
        </h1>

        <p className="mb-6 text-gray-500">
          Welcome Back
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border p-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border p-3"
        />

        <button
          onClick={login}
          className="w-full rounded-lg bg-black p-3 text-white"
        >
          Login
        </button>

        <p className="mt-6 text-center text-sm">
  Don't have an account?{" "}
  <span
    onClick={() => navigate("/register")}
    className="cursor-pointer font-semibold text-blue-600"
  >
    Register
  </span>
</p>

      </div>
    </div>
  );
}

export default LoginPage;