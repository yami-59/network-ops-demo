"use client";
import React from "react";
import useSWR from "swr";
import {
  Badge,
  Box,
  Divider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { fetcher } from "@/lib/api";
import type { RequestDetail } from "@/lib/types";
import { statusColorScheme, statusLabel } from "@/lib/labels";

const CREATOR = { name: "Yamin", email: "yamin@demo.com" };

function actorByDepartment(dep: "ENGINEERING" | "PILOTAGE" | "OPERATIONS") {
  if (dep === "PILOTAGE") return "Jean";
  if (dep === "OPERATIONS") return "Léo";
  return "Yamin";
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="blackAlpha.100"
      borderRadius="xl"
      p={3}
      bg="white"
    >
      <Text fontSize="xs" color="gray.500" mb={1}>
        {label}
      </Text>
      <Text fontWeight="700" color="gray.800" lineHeight="1.35">
        {value ?? "-"}
      </Text>
    </Box>
  );
}

export default function ViewRequestModal({
  isOpen,
  onClose,
  opId,
}: {
  isOpen: boolean;
  onClose: () => void;
  opId: string | null;
}) {
  const { data } = useSWR<RequestDetail>(
    opId ? `/api/requests/${opId}` : null,
    fetcher
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside" isCentered>
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(6px)" />
      <ModalContent borderRadius="2xl" overflow="hidden">
        {/* Header 更像卡片顶部 */}
        <ModalHeader bg="gray.50" borderBottomWidth="1px">
          <Flex align="center" gap={3}>
            <Box>
              <Heading size="md">Détails</Heading>
              <Text fontSize="sm" color="gray.600">
                {opId ?? ""}
              </Text>
            </Box>

            <Box flex="1" />

            {data?.request?.status ? (
              <Badge
                colorScheme={statusColorScheme(data.request.status)}
                borderRadius="full"
                px={3}
                py={1}
              >
                {statusLabel(data.request.status)}
              </Badge>
            ) : null}

            {/* ✅ 关闭按钮 */}
            <IconButton
              aria-label="Fermer"
              icon={<X size={18} />}
              variant="ghost"
              onClick={onClose}
            />
          </Flex>
        </ModalHeader>

        <ModalBody p={6} bg="white">
          {!data ? (
            <Text color="gray.600">Chargement…</Text>
          ) : (
            <Stack spacing={5}>
              {/* 顶部强调信息 */}
              <Box>
                <Text fontWeight="800" fontSize="xl" color="gray.900">
                  {data.request.op_id}
                </Text>
                {data.request.initial_comment ? (
                  <Text mt={1} color="gray.600">
                    {data.request.initial_comment}
                  </Text>
                ) : null}
              </Box>

              {/* 两列字段：改成小卡片 */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <Field label="Fonctionnalité" value={data.request.feature} />
                <Field label="Paramètre" value={data.request.parameter} />
                <Field label="Valeur demandée" value={data.request.value} />
                <Field label="Zone" value={data.request.zone} />
                <Field label="Priorité" value={data.request.priority} />
                <Field label="Date souhaitée" value={data.request.desired_date ?? "-"} />
                <Field label="Sites concernés" value={data.request.sites || "-"} />
                <Field
  label="Créé par"
  value={
    ((data.request as any).created_by_name ?? "Yamin") +
    " (" +
    ((data.request as any).created_by_email ?? "yamin@demo.com") +
    ")"
  }
/>

<Field
  label="Mis à jour par"
  value={(data.request as any).updated_by_name ?? "—"}
/>

              </SimpleGrid>

              <Divider />

              {/* Historique：更像 timeline 卡片 */}
              <Box>
                <HStack justify="space-between" mb={3}>
                  <Heading size="sm">Historique</Heading>
                  <Text fontSize="sm" color="gray.600">
                    {data.history.length} événement(s)
                  </Text>
                </HStack>

                {data.history.length === 0 ? (
                  <Text color="gray.600">Aucun historique.</Text>
                ) : (
                  <VStack align="stretch" spacing={3}>
                    {data.history.map((h, idx) => (
                      <Box
                        key={idx}
                        p={4}
                        bg="gray.50"
                        borderWidth="1px"
                        borderColor="blackAlpha.100"
                        borderRadius="xl"
                      >
                        <HStack spacing={2} mb={1} flexWrap="wrap">
                          <Text fontSize="sm" color="gray.600">
                            {String(h.at).replace("T", " ").slice(0, 19)}
                          </Text>
                          <Text fontSize="sm" color="gray.400">
                            •
                          </Text>
                          <Badge variant="subtle" borderRadius="full">
                            {h.department}
                          </Badge>
                          <Badge variant="subtle" borderRadius="full">
  {h.department}
</Badge>

                        </HStack>

                        <Text fontWeight="700" color="gray.900">
                          {h.from_status ? statusLabel(h.from_status) : "—"} → {statusLabel(h.to_status)}
                        </Text>

                        {h.comment ? (
                          <Text mt={2} color="gray.700" whiteSpace="pre-wrap">
                            {h.comment}
                          </Text>
                        ) : null}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </Stack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
