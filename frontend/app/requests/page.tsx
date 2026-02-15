"use client";

import React from "react";
import useSWR from "swr";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  IconButton,
  Select,
  Spacer,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  SimpleGrid,
} from "@chakra-ui/react";
import { Eye, Pencil, Plus, Filter, RotateCcw } from "lucide-react";
import { fetcher } from "@/lib/api";
import type { Priority, RequestItem, StatusCode } from "@/lib/types";
import { statusColorScheme, statusLabel } from "@/lib/labels";

import CreateRequestModal from "@/components/CreateRequestModal";
import ViewRequestModal from "@/components/ViewRequestModal";
import EditRequestModal from "@/components/EditRequestModal";

const FEATURES = ["ALL", "5G – Power Optimization", "5G – Beam Configuration"] as const;

const PARAMS_BY_FEATURE: Record<string, string[]> = {
  "5G – Power Optimization": ["ALL", "TX_POWER", "POWER_OFFSET"],
  "5G – Beam Configuration": ["ALL", "BEAM_WIDTH", "BEAM_COUNT"],
};

const PRIORITIES: Array<"ALL" | Priority> = ["ALL", "High", "Medium", "Low"];
const STATUSES: Array<"ALL" | StatusCode> = ["ALL", "PENDING", "PLANNED", "EXECUTED", "FAILED"];

type Filters = {
  feature: (typeof FEATURES)[number];
  parameter: string;
  priority: "ALL" | Priority;
  status: "ALL" | StatusCode;
};

const defaultFilters: Filters = { feature: "ALL", parameter: "ALL", priority: "ALL", status: "ALL" };

export default function RequestsPage() {
  const { data, mutate } = useSWR<RequestItem[]>(`/api/requests`, fetcher);

  const [draft, setDraft] = React.useState<Filters>(defaultFilters);
  const [applied, setApplied] = React.useState<Filters>(defaultFilters);

  const createModal = useDisclosure();
  const viewModal = useDisclosure();
  const editModal = useDisclosure();

  const [selectedOpId, setSelectedOpId] = React.useState<string | null>(null);

  const paramOptions = React.useMemo(() => {
    if (draft.feature === "ALL") return ["ALL", "TX_POWER", "POWER_OFFSET", "BEAM_WIDTH", "BEAM_COUNT"];
    return PARAMS_BY_FEATURE[draft.feature] ?? ["ALL"];
  }, [draft.feature]);

  React.useEffect(() => {
    if (draft.feature !== "ALL") {
      const allowed = PARAMS_BY_FEATURE[draft.feature] ?? ["ALL"];
      if (!allowed.includes(draft.parameter)) setDraft((p) => ({ ...p, parameter: "ALL" }));
    }
  }, [draft.feature]);

  const rows = React.useMemo(() => {
    const items = data ?? [];
    return items.filter((r) => {
      if (applied.feature !== "ALL" && r.feature !== applied.feature) return false;
      if (applied.parameter !== "ALL" && r.parameter !== applied.parameter) return false;
      if (applied.priority !== "ALL" && r.priority !== applied.priority) return false;
      if (applied.status !== "ALL" && r.status !== applied.status) return false;
      return true;
    });
  }, [data, applied]);

  return (
    <VStack align="stretch" spacing={4}>
      <Flex align="center">
        <Heading size="lg">Gestion des demandes</Heading>
        <Spacer />
        <Button leftIcon={<Plus size={18} />} colorScheme="blue" onClick={createModal.onOpen}>
          Créer une demande
        </Button>
      </Flex>

      <Card borderRadius="2xl">
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4} alignItems="end">
  <FormControl>
    <FormLabel>Fonctionnalité</FormLabel>
    <Select
      value={draft.feature}
      onChange={(e) => setDraft((p) => ({ ...p, feature: e.target.value as any }))}
    >
      {FEATURES.map((f) => (
        <option key={f} value={f}>
          {f === "ALL" ? "Tous" : f}
        </option>
      ))}
    </Select>
  </FormControl>

  <FormControl>
    <FormLabel>Paramètre</FormLabel>
    <Select
      value={draft.parameter}
      onChange={(e) => setDraft((p) => ({ ...p, parameter: e.target.value }))}
    >
      {paramOptions.map((p) => (
        <option key={p} value={p}>
          {p === "ALL" ? "Tous" : p}
        </option>
      ))}
    </Select>
  </FormControl>

  <FormControl>
    <FormLabel>Priorité</FormLabel>
    <Select
      value={draft.priority}
      onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value as any }))}
    >
      {PRIORITIES.map((x) => (
        <option key={x} value={x}>
          {x === "ALL" ? "Toutes" : x}
        </option>
      ))}
    </Select>
  </FormControl>

  <FormControl>
    <FormLabel>Statut</FormLabel>
    <Select
      value={draft.status}
      onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as any }))}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s === "ALL" ? "Tous" : statusLabel(s)}
        </option>
      ))}
    </Select>
  </FormControl>

  <HStack spacing={2}>
    <Button leftIcon={<Filter size={16} />} colorScheme="blue" onClick={() => setApplied(draft)}>
      Filtrer
    </Button>
    <Button
      leftIcon={<RotateCcw size={16} />}
      variant="outline"
      onClick={() => {
        setDraft(defaultFilters);
        setApplied(defaultFilters);
      }}
    >
      Réinitialiser
    </Button>
  </HStack>
</SimpleGrid>


          <Box mt={3} fontSize="sm" color="gray.600">
            Résultats: <b>{rows.length}</b>
          </Box>
        </CardBody>
      </Card>

      <Card borderRadius="2xl">
        <CardBody>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Fonctionnalité</Th>
                  <Th>Paramètre</Th>
                  <Th>Valeur demandée</Th>
                  <Th>Zone</Th>
                  <Th>Priorité</Th>
                  <Th>Statut</Th>
                  <Th>Date souhaitée</Th>
                  <Th textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.length === 0 ? (
                  <Tr>
                    <Td colSpan={8} py={10} color="gray.600">
                      Aucune demande.
                    </Td>
                  </Tr>
                ) : (
                  rows.map((r) => (
                    <Tr key={r.op_id} _hover={{ bg: "blackAlpha.50" }}>
                      <Td>
                        <Box fontWeight="700">{r.feature}</Box>
                        <Box fontSize="sm" color="gray.600" noOfLines={1}>
                          {r.op_id}
                        </Box>
                      </Td>
                      <Td fontWeight="600">{r.parameter}</Td>
                      <Td>{r.value}</Td>
                      <Td>{r.zone}</Td>
                      <Td>{r.priority}</Td>
                      <Td>
                        <Badge colorScheme={statusColorScheme(r.status)} borderRadius="full" px={2} py={1}>
                          {statusLabel(r.status)}
                        </Badge>
                      </Td>
                      <Td>{r.desired_date ?? "-"}</Td>
                      <Td textAlign="right">
                        <IconButton
                          aria-label="Voir"
                          icon={<Eye size={18} />}
                          variant="ghost"
                          onClick={() => {
                            setSelectedOpId(r.op_id);
                            viewModal.onOpen();
                          }}
                        />
                        <IconButton
                          aria-label="Éditer"
                          icon={<Pencil size={18} />}
                          variant="ghost"
                          onClick={() => {
                            setSelectedOpId(r.op_id);
                            editModal.onOpen();
                          }}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      <CreateRequestModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onCreated={async () => {
          await mutate();
        }}
      />

      <ViewRequestModal isOpen={viewModal.isOpen} onClose={viewModal.onClose} opId={selectedOpId} />

      <EditRequestModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        opId={selectedOpId}
        onUpdated={async () => {
          await mutate();
        }}
      />
    </VStack>
  );
}
