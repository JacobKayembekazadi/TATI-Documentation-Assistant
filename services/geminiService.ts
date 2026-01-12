
import OpenAI from "openai";
import { Shipment } from "../types";

const SYSTEM_INSTRUCTION = `You are the Documentation Assistant for Texas American Trade Inc. (TATI).
Your purpose is to help prepare complete, accurate documentation for USA -> Mexico chemical shipments.

COMPLETE DOCUMENT LIST:
1. COMMERCIAL INVOICE (Factura Comercial) - TATI
2. PACKING LIST (Lista de Empaque) - TATI
3. CERTIFICATE OF ORIGIN (USMCA) - TATI
4. EEI/AES FILING - TATI/Broker
5. BILL OF LADING - Carrier
6. CARTA PORTE - MX Broker/Carrier
7. PEDIMENTO - MX Broker
8. SAFETY DATA SHEET (SPANISH) - TATI
9. CERTIFICATE OF ANALYSIS - TATI
10. PEMEX DOCUMENTS (Gate Pass, REPSE) - If PEMEX delivery
11. HAZMAT DOCUMENTS (Dangerous Goods Dec) - If Hazmat

FORMATTING RULES:
- Do NOT use markdown formatting (NO bold, NO italics).
- Use plain text only.
- Use short --- dividers between sections.
- Use bullet points •
- Respond in the language of input (English or Spanish).

When generating a shipment report, use the following template exactly:

---
📦 SHIPMENT DETAILS
---
Product: [Product name]
Quantity: [Amount]
Destination: [City, Mexico]
Ship date: [Date]
Customer: [Name]
PEMEX delivery: [Yes/No]
Hazmat: [Yes/No]

---
📋 REQUIRED DOCUMENTS
---
[List all docs and who prepares them]

---
📅 DOCUMENT TIMELINE
---
By [Date - 5 days]: [Tasks]
By [Date - 3 days]: [Tasks]
By [Date - 1 day]: [Tasks]
Ship date [Date]: [Tasks]

---
⚠️ WATCH OUT FOR
---
[3 relevant common mistakes]

---
📞 KEY CONTACTS NEEDED
---
- Mexican customs broker
- Mexican carrier (for Carta Porte)
- PEMEX contact (if applicable)
- Buyer contact for RFC verification

---
✅ PRE-SHIPMENT CHECKLIST
---
[List required checks]

---
💡 RECOMMENDATIONS
---
[Specific advice]`;

const openai = new OpenAI({
  apiKey: process.env.API_KEY || "",
  dangerouslyAllowBrowser: true,
});

export async function generateShipmentReport(shipment: Shipment): Promise<string> {
  const prompt = `Generate a full shipment documentation report for the following details:
  Product: ${shipment.productName}
  Quantity: ${shipment.quantity}
  Destination: ${shipment.destination}
  Ship Date: ${shipment.shipDate}
  Customer: ${shipment.customerName}
  Is PEMEX delivery: ${shipment.isPemex ? 'Yes' : 'No'}
  Is Hazmat: ${shipment.isHazmat ? 'Yes' : 'No'}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
    });

    return response.choices[0]?.message?.content || "Failed to generate report.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Error generating AI report. Please check your API key and connection.";
  }
}

export async function askAssistant(question: string, context?: Shipment): Promise<string> {
  let prompt = question;
  if (context) {
    prompt = `Context of current shipment: ${JSON.stringify(context)}\n\nQuestion: ${question}`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION + "\nRespond to specific questions concisely using the provided plain text formatting rules." },
        { role: "user", content: prompt },
      ],
    });

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "I encountered an error communicating with the server.";
  }
}
