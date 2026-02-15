"use client";
import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Menu,
  MenuButton,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import { postJson } from "@/lib/api";
import type { Priority } from "@/lib/types";

const FEATURES = ["5G – Power Optimization", "5G – Beam Configuration"] as const;

const PARAMS_BY_FEATURE: Record<(typeof FEATURES)[number], string[]> = {
  "5G – Power Optimization": ["TX_POWER", "POWER_OFFSET"],
  "5G – Beam Configuration": ["BEAM_WIDTH", "BEAM_COUNT"],
};

const VALUE_EXAMPLES: Record<string, string> = {
  TX_POWER: "ex: 240W",
  POWER_OFFSET: "ex: +2 dB",
  BEAM_WIDTH: "ex: 65°",
  BEAM_COUNT: "ex: 8",
};

const ZONES = ["Dense", "Rural"] as const;

const SITES = [
  "SITE_PARIS_001",
  "SITE_PARIS_002",
  "SITE_LYON_001",
  "SITE_LYON_002",
  "SITE_MARSEILLE_001",
  "SITE_LILLE_001",
];

const CREATOR = { name: "Yamin", email: "yamin@demo.com" };

function actorByDepartment(dep: "ENGINEERING" | "PILOTAGE" | "OPERATIONS") {
  if (dep === "PILOTAGE") return "Jean";
  if (dep === "OPERATIONS") return "Léo";
  return "Yamin";
}


function SitesMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (s: string) => {
    if (value.includes(s)) onChange(value.filter((x) => x !== s));
    else onChange([...value, s]);
  };

  return (
    <Menu closeOnSelect={false}>
      <MenuButton as={Button} variant="outline" rightIcon={<ChevronDown size={16} />}>
        {value.length === 0 ? "Sélectionner..." : `${value.length} site(s) sélectionné(s)`}
      </MenuButton>
      <MenuList maxH="260px" overflowY="auto" p={2}>
        <Text fontSize="sm" color="gray.600" px={2} pb={2}>
          Sites concernés
        </Text>
        <Divider mb={2} />
        {SITES.map((s) => (
          <Box
            key={s}
            px={2}
            py={1}
            _hover={{ bg: "blackAlpha.50" }}
            borderRadius="md"
            onClick={() => toggle(s)}
            cursor="pointer"
          >
            <Checkbox isChecked={value.includes(s)} pointerEvents="none">
              {s}
            </Checkbox>
          </Box>
        ))}
      </MenuList>
    </Menu>
  );
}

export default function CreateRequestModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();

  const [feature, setFeature] = React.useState<(typeof FEATURES)[number]>("5G – Power Optimization");
  const [parameter, setParameter] = React.useState<string>("TX_POWER");
  const [value, setValue] = React.useState("");
  const [zone, setZone] = React.useState<(typeof ZONES)[number]>("Dense");
  const [sites, setSites] = React.useState<string[]>([]);
  const [desiredDate, setDesiredDate] = React.useState<string>("");
  const [priority, setPriority] = React.useState<Priority>("High");
  const [comment, setComment] = React.useState<string>("");

  React.useEffect(() => {
    const first = PARAMS_BY_FEATURE[feature][0];
    setParameter(first);
    setValue("");
  }, [feature]);

  const submit = async () => {
    if (!value.trim() || sites.length === 0) {
      toast({ status: "error", title: "Valeur demandée et Sites concernés sont obligatoires." });
      return;
    }

    const payload = {
      feature,
      parameter,
      value: value.trim(),
      zone,
      sites: sites.join(", "),
      desired_date: desiredDate || null,
      priority,
      initial_comment: comment.trim() || null,

        // ✅ front-only audit fields
      created_by_name: CREATOR.name,
      created_by_email: CREATOR.email,
      updated_by_name: CREATOR.name,
    };

    try {
      await postJson(`/api/requests`, payload);
      toast({ status: "success", title: "Demande créée." });
      onClose();
      onCreated();
      // reset
      setSites([]);
      setDesiredDate("");
      setComment("");
    } catch (e: any) {
      toast({ status: "error", title: "Erreur", description: e.message });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>Créer une demande</ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <HStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Fonctionnalité</FormLabel>
                <Select value={feature} onChange={(e) => setFeature(e.target.value as any)}>
                  {FEATURES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Paramètre</FormLabel>
                <Select value={parameter} onChange={(e) => setParameter(e.target.value)}>
                  {PARAMS_BY_FEATURE[feature].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Zone</FormLabel>
                <Select value={zone} onChange={(e) => setZone(e.target.value as any)}>
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>

            <HStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Valeur demandée</FormLabel>
                <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={VALUE_EXAMPLES[parameter]} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Sites concernés</FormLabel>
                <SitesMultiSelect value={sites} onChange={setSites} />
              </FormControl>
            </HStack>

            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Date souhaitée</FormLabel>
                <Input type="date" value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} />
              </FormControl>

              <FormControl>
                <FormLabel>Priorité</FormLabel>
                <Select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </Select>
              </FormControl>
            </HStack>

            <FormControl>
  <FormLabel>Créateur (email)</FormLabel>
  <Input value={CREATOR.email} isReadOnly />
</FormControl>


            <FormControl>
              <FormLabel>Commentaire initial</FormLabel>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Contexte / justification…" />
            </FormControl>

            <Box fontSize="sm" color="gray.600">
              Département par défaut: <b>Engineering</b> (création)
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Fermer
          </Button>
          <Button colorScheme="blue" onClick={submit}>
            Créer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
