import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
        }),
      });

      const message = await response.text();

      if (message === "Registration Successful") {
        alert("Registration Successful!");
        navigate("/");
      } else {
        alert(message);
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
          Create Account
        </h1>

        <p className="mb-6 text-gray-500">
          Register to use CollabBoard AI
        </p>

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mb-4 w-full rounded-lg border p-3"
        />

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
          className="mb-6 w-full rounded-lg border p-3"
        />

        <button
          onClick={register}
          className="w-full rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700"
        >
          Register
        </button>

        <button
          onClick={() => navigate("/")}
          className="mt-4 w-full rounded-lg border p-3"
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}

export default RegisterPage;