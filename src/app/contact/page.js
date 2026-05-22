import Link from "next/link";

export default function Contact() {
  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>

      <Link href="/" style={backStyle}>
        ← Back to Store
      </Link>

      <div style={boxStyle}>
        <h1>Contact Us</h1>
        <p>📞 +91 94931 63557</p>
        <p>📧 supportlmart@gmail.com</p>
        <p>📍 Agadalalanka, Eluru District</p>
      </div>

    </div>
  );
}

const backStyle = {
  display: "inline-block",
  marginBottom: 20,
  background: "#4E2A4F",
  color: "white",
  padding: "8px 14px",
  borderRadius: 8,
  textDecoration: "none"
};

const boxStyle = {
  background: "white",
  padding: 25,
  borderRadius: 12,
  boxShadow: "0 8px 25px rgba(0,0,0,0.08)"
};