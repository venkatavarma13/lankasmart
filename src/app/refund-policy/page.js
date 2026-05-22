import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>

      <Link href="/" style={backStyle}>
        ← Back to Store
      </Link>

      <div style={boxStyle}>
        <h1>Refund Policy</h1>
        <p>
          Refunds are available only for damaged or wrong products.
          Request must be raised within 24 hours.
        </p>
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