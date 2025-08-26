import React, { useEffect, useState } from "react";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching transactions:", error);
        setLoading(false);
      });
  }, []);

  const formatDate = (rawDate) => {
    const year = rawDate.slice(0, 4);
    const month = rawDate.slice(4, 6);
    const day = rawDate.slice(6, 8);
    const hour = rawDate.slice(8, 10);
    const min = rawDate.slice(10, 12);
    const sec = rawDate.slice(12, 14);
    return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>M-PESA Transactions</h2>

      {loading ? (
        <p>Loading...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions available.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Receipt Number</th>
              <th>Phone Number</th>
              <th>Amount (KES)</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.mpesaReceiptNumber}</td>
                <td>{tx.phoneNumber}</td>
                <td>{tx.amount}</td>
                <td>{formatDate(tx.transactionDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Transactions;