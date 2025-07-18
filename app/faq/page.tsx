"use client"
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, Box, Button, Paper } from "@mui/material"
import { ExpandMore, ArrowBack } from "@mui/icons-material"
import Link from "next/link"

const faqData = [
  {
    question: "What is ABACUS?",
    answer:
      "ABACUS is an intelligent assistant designed to help you navigate the Ameritas technology landscape. You can ask it about approved technologies, standards, versions, and best practices.",
  },
  {
    question: "How do I start a new chat?",
    answer:
      "You can start a new chat at any time by clicking the 'New Chat' button in the top-left corner of the sidebar. This will clear your current conversation and provide a fresh start.",
  },
  {
    question: "Can I see my past questions?",
    answer:
      "Yes, your previous user prompts are saved in the 'History' section of the sidebar. Clicking on a past prompt will load it into the input box for you to reuse or edit.",
  },
  {
    question: "Are the AI's responses always accurate?",
    answer:
      "While ABACUS is a powerful tool, some responses may not be 100% accurate or up-to-date. It's always a good practice to verify critical information through official documentation or by consulting with a subject matter expert.",
  },
  {
    question: "How do I use the suggested prompts?",
    answer:
      "When you start a new chat, several suggestion cards will appear. Clicking on one of these cards will copy the prompt text directly into the chat input box, allowing you to send it as is or modify it before submitting.",
  },
]

export default function FaqPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <Link href="/" passHref>
          <Button startIcon={<ArrowBack />}>Back to Chat</Button>
        </Link>
      </Box>

      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: "bold", textAlign: "center" }}>
          Frequently Asked Questions
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ textAlign: "center", mb: 5 }}>
          Need help? Here are some common questions about ABACUS.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {faqData.map((item, index) => (
            <Accordion key={index} variant="outlined" sx={{ borderRadius: 2, "&:before": { display: "none" } }}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls={`panel${index}-content`}
                id={`panel${index}-header`}
                sx={{
                  "& .MuiAccordionSummary-content": {
                    fontWeight: "600",
                  },
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{item.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>
    </Container>
  )
}
