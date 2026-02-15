"use client";
import React from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";

import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { fetcher, postJson } from "@/lib/api";
import type { Department, RequestDetail, StatusCode } from "@/lib/types";
import { statusColorScheme, statusLabel } from "@/lib/labels";


const DEPARTMENTS: Department[] = ["Engineering", "Pilotage", "Operations"];

const STATUSES: StatusCode[] = ["PENDING", "PLANNED", "EXECUTED", "FAILED"];


const CREATOR = { name: "Yamin", email: "yamin@demo.com" };

function actorByDepartment(dep: Department) {
  if (dep === "Pilotage") return "Jean";
  if (dep === "Operations") return "Léo";
  return "Yamin"; // Engineering
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

export default function EditRequestModal({
  isOpen,
  onClose,
  opId,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  opId: string | null;
  onUpdated: () => void;
}) {
  const toast = useToast();

  const { data } = useSWR<RequestDetail>(
    opId ? `/api/requests/${opId}` : null,
    fetcher
  );

  const [department, setDepartment] = React.useState<Department>("Pilotage");
  const [toStatus, setToStatus] = React.useState<StatusCode>("PLANNED");
  const [comment, setComment] = React.useState("");

  const { mutate } = useSWRConfig();
  
  React.useEffect(() => {
    if (!data?.request?.status) return;
    const cur = data.request.status;
    if (cur === "PENDING") setToStatus("PLANNED");
    else if (cur === "PLANNED") setToStatus("EXECUTED");
    else setToStatus(cur);
  }, [data?.request?.status]);

  const submit = async () => {
    if (!opId) return;
    if (!comment.trim()) {
      toast({ status: "error", title: "Le commentaire est obligatoire." });
      return;
    }
    const actorName = actorByDepartment(department);


    try {
      await postJson(`/api/requests/${opId}/status`, {
        department: department.toUpperCase() as any,
        to_status: toStatus,
        comment: comment.trim(),
        actor_name: actorName,
      });

      await mutate(`/api/requests/${opId}`);
      await mutate(`/api/requests`);

      toast({ status: "success", title: "Mise à jour enregistrée." });
      onClose();
      setComment("");
      onUpdated();
    } catch (e: any) {
      toast({ status: "error", title: "Erreur", description: e.message });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside" isCentered>
      {/* ✅ 跟查看详情一致：blur overlay */}
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(6px)" />

      <ModalContent borderRadius="2xl" overflow="hidden">
        {/* ✅ 跟查看详情一致：header 灰底 + 右上角 Fermer */}
        <ModalHeader bg="gray.50" borderBottomWidth="1px">
          <HStack justify="space-between" align="center">
            <Text fontWeight="700">Éditer</Text>
            {/* <Button size="sm" variant="ghost" onClick={onClose}>
              Fermer
            </Button> */}
          </HStack>
        </ModalHeader>

        <ModalBody py={6}>
          {!data ? (
            <Text color="gray.600">Chargement…</Text>
          ) : (
            <Stack spacing={5}>
              {/* ✅ 顶部：详情展示（同款风格，不改字段） */}
              <Box>
                <HStack justify="space-between" align="start">
                  <Box>
                    <Text fontWeight="800" fontSize="lg">
                      {data.request.op_id}
                    </Text>
                    <Badge
                      mt={2}
                      colorScheme={statusColorScheme(data.request.status)}
                      borderRadius="full"
                      px={3}
                      py={1}
                    >
                      {statusLabel(data.request.status)}
                    </Badge>
                  </Box>
                  <Text color="gray.600">
                    Statut actuel: {statusLabel(data.request.status)}
                  </Text>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={4}>
                  <Field label="Fonctionnalité" value={data.request.feature} />
                  <Field label="Paramètre" value={data.request.parameter} />
                  <Field label="Valeur demandée" value={data.request.value} />
                  <Field label="Zone" value={data.request.zone} />
                  <Field label="Priorité" value={data.request.priority} />
                  <Field label="Date souhaitée" value={data.request.desired_date ?? "-"} />
                  <Field label="Sites concernés" value={data.request.sites || "-"} />
                  <Field label="Créé par" value={(data.request as any).created_by_name ?? "Yamin"} />
                  <Field label="Mis à jour par" value={(data.request as any).updated_by_name ?? "—"} />

                </SimpleGrid>
              </Box>

              <Divider />

              {/* ✅ 下半部分：编辑区（保留你原来的逻辑 & 字段） */}
              <VStack align="stretch" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Département</FormLabel>
                  <Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as any)}
                  >
                    {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}

                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Nouveau statut</FormLabel>
                  <Select value={toStatus} onChange={(e) => setToStatus(e.target.value as any)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Commentaire</FormLabel>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Pourquoi / résultat / incident…"
                    minH="120px"
                  />
                </FormControl>
              </VStack>
            </Stack>
          )}
        </ModalBody>

        {/* ✅ Footer：保留原按钮逻辑，但更统一的间距 */}
        <ModalFooter bg="white" borderTopWidth="1px">
          <Button variant="ghost" mr={3} onClick={onClose}>
            Fermer
          </Button>
          <Button colorScheme="blue" onClick={submit}>
            Enregistrer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
