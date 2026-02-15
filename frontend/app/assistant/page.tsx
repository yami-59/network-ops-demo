"use client";

import React from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Heading,
  HStack,
  IconButton,
  Tag,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { Send, Sparkles } from "lucide-react";
import { postJson } from "@/lib/api";

type AssistantResp = { answer: string; references: string[] };

type Msg =
  | { id: string; role: "user"; text: string; createdAt: number }
  | { id: string; role: "assistant"; text: string; references: string[]; createdAt: number }
  | { id: string; role: "assistant"; text: string; references: string[]; createdAt: number; pending: true };

const PRESETS = [
  "Quelles opérations sont planifiées cette semaine ?",
  "Quelles opérations ont été exécutées ?",
  "Y a-t-il des opérations en échec ?",
  "Statut de OP-2026-0001 ?",
];

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function AssistantPage() {
  const toast = useToast();
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>(() => [
    {
      id: uid(),
      role: "assistant",
      text: "Bonjour 👋 Je réponds uniquement à partir des données enregistrées (anti-hallucination). Posez-moi une question.",
      references: [],
      createdAt: Date.now(),
    },
  ]);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // auto scroll to bottom
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || loading) return;

    setLoading(true);

    const userMsg: Msg = { id: uid(), role: "user", text, createdAt: Date.now() };
    const pendingId = uid();
    const pendingMsg: Msg = {
      id: pendingId,
      role: "assistant",
      text: "Je réfléchis…",
      references: [],
      createdAt: Date.now(),
      pending: true,
    };

    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setQ("");

    try {
      const r: AssistantResp = await postJson(`/api/assistant`, { question: text });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                id: pendingId,
                role: "assistant",
                text: r.answer,
                references: r.references ?? [],
                createdAt: Date.now(),
              }
            : m
        )
      );
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                id: pendingId,
                role: "assistant",
                text: "Désolé, une erreur est survenue.",
                references: [],
                createdAt: Date.now(),
              }
            : m
        )
      );
      toast({
        status: "error",
        title: "Erreur",
        description: e?.message ?? "Request failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(q);
    }
  };

  return (
    <VStack align="stretch" spacing={4} height="calc(100vh - 120px)">
      <HStack justify="space-between" align="center">
        <Heading size="lg">Assistant IA</Heading>

        <HStack spacing={2}>
          <Button
            leftIcon={<Sparkles size={16} />}
            variant="outline"
            onClick={() =>
              setMessages([
                {
                  id: uid(),
                  role: "assistant",
                  text: "Bonjour 👋 Je réponds uniquement à partir des données enregistrées (anti-hallucination). Posez-moi une question.",
                  references: [],
                  createdAt: Date.now(),
                },
              ])
            }
          >
            Nouvelle conversation
          </Button>
        </HStack>
      </HStack>

      {/* Presets */}
      <Card borderRadius="2xl">
        <CardBody>
          <HStack wrap="wrap" spacing={2}>
            {PRESETS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant="outline"
                onClick={() => {
                  setQ(p);
                  ask(p);
                }}
              >
                {p}
              </Button>
            ))}
          </HStack>
        </CardBody>
      </Card>

      {/* Chat area */}
      <Card borderRadius="2xl" flex="1" overflow="hidden">
        <CardBody p={0} display="flex" flexDirection="column" height="100%">
          <Box
            ref={scrollRef}
            flex="1"
            overflowY="auto"
            px={{ base: 3, md: 6 }}
            py={{ base: 3, md: 5 }}
            bg="gray.50"
          >
            <VStack align="stretch" spacing={4}>
              {messages.map((m) => {
                const isUser = m.role === "user";

                return (
                  <HStack
                    key={m.id}
                    align="flex-start"
                    justify={isUser ? "flex-end" : "flex-start"}
                    spacing={3}
                  >
                    {!isUser ? (
                      <Avatar size="sm" name="Assistant" bg="blue.500" />
                    ) : null}

                    <Box
                      maxW={{ base: "92%", md: "70%" }}
                      bg={isUser ? "blue.500" : "white"}
                      color={isUser ? "white" : "gray.800"}
                      borderRadius="2xl"
                      px={4}
                      py={3}
                      boxShadow="sm"
                      borderWidth={isUser ? "0" : "1px"}
                      borderColor="blackAlpha.100"
                    >
                      <Text whiteSpace="pre-wrap" lineHeight="1.6">
                        {m.text}
                      </Text>

                      {"references" in m && m.references?.length > 0 ? (
                        <>
                          <Divider my={3} opacity={0.25} />
                          <HStack wrap="wrap" spacing={2}>
                            {m.references.map((id) => (
                              <Tag
                                key={id}
                                borderRadius="full"
                                size="sm"
                                bg={isUser ? "whiteAlpha.300" : "blackAlpha.50"}
                                color={isUser ? "white" : "gray.700"}
                              >
                                {id}
                              </Tag>
                            ))}
                          </HStack>
                        </>
                      ) : null}
                    </Box>

                    {isUser ? <Avatar size="sm" name="Vous" bg="gray.400" /> : null}
                  </HStack>
                );
              })}
            </VStack>
          </Box>

          {/* Input */}
          <Box px={{ base: 3, md: 6 }} py={4} bg="white" borderTopWidth="1px" borderColor="blackAlpha.100">
            <HStack align="flex-end" spacing={3}>
              <Textarea
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Écrivez votre question… (Entrée pour envoyer, Shift+Entrée pour retour à la ligne)"
                resize="none"
                rows={2}
                borderRadius="xl"
                bg="gray.50"
              />
              <IconButton
                aria-label="Envoyer"
                icon={<Send size={18} />}
                colorScheme="blue"
                onClick={() => ask(q)}
                isLoading={loading}
                isDisabled={!q.trim() || loading}
              />
            </HStack>

            <Text mt={2} fontSize="xs" color="gray.500">
              L’assistant répond uniquement à partir des données enregistrées (anti-hallucination).
            </Text>
          </Box>
        </CardBody>
      </Card>
    </VStack>
  );
}
