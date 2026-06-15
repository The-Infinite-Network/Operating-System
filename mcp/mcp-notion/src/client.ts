import { Client } from "@notionhq/client";
import { getConfig } from "./config.js";
import { Logger, MCPError, ErrorCodes } from "./errors.js";

const logger = new Logger("NotionClient");

export class NotionClient {
  private client: Client;
  private config = getConfig();
  private inboxPropertyCache:
    | {
      title?: { name: string; type: string };
      summary?: { name: string; type: string };
      source_type?: { name: string; type: string };
      source_type_code?: { name: string; type: string };
      source_url?: { name: string; type: string };
      source_ref?: { name: string; type: string };
      sensitivity?: { name: string; type: string };
      sensitivity_code?: { name: string; type: string };
      entity_id?: { name: string; type: string };
      entity_name?: { name: string; type: string };
      room_id?: { name: string; type: string };
      room_name?: { name: string; type: string };
      routing_status?: { name: string; type: string };
      routing_status_code?: { name: string; type: string };
      lane?: { name: string; type: string };
      lane_code?: { name: string; type: string };
      layer?: { name: string; type: string };
      layer_code?: { name: string; type: string };
      domain?: { name: string; type: string };
      domain_code?: { name: string; type: string };
      object_type?: { name: string; type: string };
      object_type_code?: { name: string; type: string };
      owner_pod?: { name: string; type: string };
      owner_pod_code?: { name: string; type: string };
      destination_db?: { name: string; type: string };
      destination_db_code?: { name: string; type: string };
      routing_key?: { name: string; type: string };
      target_url?: { name: string; type: string };
      target_notion_id?: { name: string; type: string };
      captured_at?: { name: string; type: string };
      captured_by?: { name: string; type: string };
      verified_at?: { name: string; type: string };
      verified_by?: { name: string; type: string };
      blocker_reason?: { name: string; type: string };
      duplicate_of?: { name: string; type: string };
      tags?: { name: string; type: string };
      move_log?: { name: string; type: string };
      last_move_request_id?: { name: string; type: string };
    }
    | null = null;

  constructor() {
    const clientOptions: any = { auth: this.config.NOTION_API_KEY };
    // Add API version if specified in config
    if ((this.config as any).NOTION_VERSION) {
      clientOptions.notionVersion = (this.config as any).NOTION_VERSION;
    }
    this.client = new Client(clientOptions);
  }

  async ["databases.list"]() {
    try {
      logger.info("Fetching list of databases");
      const databases = [
        {
          id: this.config.NOTION_DB_MISSIONS || "",
          title: "TEAM AI Missions",
        },
      ];

      if ((this.config as any).NOTION_FOOD_INGREDIENTS_DB_ID) {
        databases.push({
          id: (this.config as any).NOTION_FOOD_INGREDIENTS_DB_ID,
          title: "[FOOD] Ingredients",
        });
      }

      return {
        databases,
      };
    } catch (error) {
      logger.error("Failed to list databases", error);
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to fetch databases",
        {
          operation: "list_databases",
          originalError: String(error),
        }
      );
    }
  }

  async listMissions(filters: any = {}) {
    try {
      logger.info("Starting listMissions", { filters });
      const dbId = this.config.NOTION_DB_MISSIONS;
      if (!dbId) {
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_MISSIONS not configured",
          { operation: "list_missions" }
        );
      }

      // Detect actual property names from schema
      let titleName = "Mission Title";
      let statusName = "Status";
      let statusType: 'status' | 'select' = 'select';
      let priorityName = "Priority";
      let entityName = "Entity";
      let roomName = "Room / Primary Pod";

      try {
        const dbSchema = await this.client.databases.retrieve({ database_id: dbId });
        const props = (dbSchema as any).properties || {};

        // Detect Title
        const titleProps = ["Mission Title", "Name", "Title"];
        for (const name of titleProps) {
          if (props[name]?.type === "title") {
            titleName = name;
            break;
          }
        }

        // Detect Status
        const statusProps = ["Status", "State", "Stage"];
        for (const name of statusProps) {
          if (props[name]) {
            statusName = name;
            statusType = props[name].type === "status" ? "status" : "select";
            logger.info("Detected status property", { statusName, statusType });
            break;
          }
        }

        if (!statusName || !props[statusName]) {
          logger.warn("Could not find a status property, available properties:", { keys: Object.keys(props) });
        }

        // Detect Priority
        const priorityProps = ["Priority"];
        for (const name of priorityProps) {
          if (props[name]?.type === "select" || props[name]?.type === "number") {
            priorityName = name;
            break;
          }
        }

        // Detect Entity
        const entityProps = ["Entity", "Entity Registry"];
        for (const name of entityProps) {
          if (props[name]?.type === "select" || props[name]?.type === "relation") {
            entityName = name;
            break;
          }
        }

        // Detect Room
        const roomProps = ["Room / Primary Pod", "Room", "Pod"];
        for (const name of roomProps) {
          if (props[name]?.type === "select" || props[name]?.type === "rich_text") {
            roomName = name;
            break;
          }
        }
      } catch (e) {
        logger.warn("Failed to retrieve schema for property detection", { error: String(e) });
      }

      const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 50;
      const andFilters: any[] = [];

      if (filters.status) {
        andFilters.push({
          property: statusName,
          [statusType]: { equals: filters.status },
        });
      }

      if (filters.room_code || filters.room) {
        andFilters.push({
          property: roomName,
          select: { equals: filters.room_code || filters.room },
        });
      }

      if (filters.guild_code) {
        andFilters.push({
          property: "Guild Code",
          rich_text: { equals: filters.guild_code },
        });
      }

      if (filters.query) {
        andFilters.push({
          property: titleName,
          title: { contains: filters.query },
        });
      }

      const queryParams: any = {
        database_id: dbId,
        page_size: limit,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      };

      logger.info("Detected property names for missions query", {
        titleName, statusName, statusType, roomName, priorityName, entityName
      });

      if (andFilters.length > 0) {
        queryParams.filter = andFilters.length === 1 ? andFilters[0] : { and: andFilters };
      }

      logger.info("Executing missions query with filter", { filter: queryParams.filter });
      const result = await this.client.databases.query(queryParams);

      // (Mapping uses detected names)
      let titlePropertyName = titleName;
      let statusPropertyName = statusName;
      let priorityPropertyName = priorityName;
      let entityPropertyName = entityName;

      // Debug: Log first mission's properties to understand structure
      if (result.results && result.results.length > 0) {
        const firstPage = result.results[0] as any;
        const firstProps = firstPage.properties || {};
        logger.info("Sample mission properties (first mission)", {
          pageId: firstPage.id,
          propertyNames: Object.keys(firstProps),
          titleProperty: titlePropertyName,
          titleValue: titlePropertyName ? firstProps[titlePropertyName] : null,
          allTitleProps: Object.entries(firstProps)
            .filter(
              ([_, prop]: [string, any]) =>
                prop?.type === "title" || prop?.title
            )
            .map(([name, prop]: [string, any]) => ({
              name,
              value: prop?.title?.[0]?.plain_text || prop,
            })),
        });
      }

      const missions = (result.results || []).map((page: any) => {
        const props = page.properties || {};

        // Title: use detected property name or try common names
        let title = "Untitled";
        if (titlePropertyName) {
          const titleProp = props[titlePropertyName];
          if (titleProp?.title?.[0]?.plain_text) {
            title = titleProp.title[0].plain_text;
          } else {
            // Debug: log why title wasn't found
            if (titleProp) {
              logger.debug(
                `Title property '${titlePropertyName}' exists but has no text`,
                {
                  propertyType: titleProp.type,
                  hasTitle: !!titleProp.title,
                  titleLength: titleProp.title?.length || 0,
                }
              );
            }
          }
        }

        // Fallback to common property names if detected name didn't work
        if (title === "Untitled") {
          title =
            props["Mission Title"]?.title?.[0]?.plain_text ||
            props.Name?.title?.[0]?.plain_text ||
            props.Title?.title?.[0]?.plain_text ||
            "Untitled";
        }

        // If still untitled, try to find any property with title content
        if (title === "Untitled") {
          for (const [propName, propValue] of Object.entries(props)) {
            if (propValue && typeof propValue === "object") {
              const titleText = (propValue as any)?.title?.[0]?.plain_text;
              if (titleText && titleText.trim()) {
                title = titleText;
                logger.info(`Found title in property '${propName}'`, { title });
                break;
              }
            }
          }
        }

        // Status: use detected property name or try common names
        let status = "Unknown";
        if (statusPropertyName) {
          const statusProp = props[statusPropertyName];
          if (statusProp?.select?.name) {
            status = statusProp.select.name;
          } else if (statusProp?.status?.name) {
            // Some status properties might use different structure
            status = statusProp.status.name;
          }
        }

        // Fallback to common property names
        if (status === "Unknown") {
          status =
            props.Status?.select?.name ||
            props.Status?.status?.name ||
            props["Status 2"]?.select?.name ||
            props["Status 2"]?.status?.name ||
            props.State?.select?.name ||
            props.State?.status?.name ||
            "Unknown";
        }

        // Priority: preserve as string for frontend compatibility (e.g., "P0", "P1")
        // Frontend expects string format for .startsWith() calls
        let priority: string | null = null;

        // Use detected property name or try Priority
        const priorityProp = priorityPropertyName
          ? props[priorityPropertyName]
          : props.Priority;

        if (priorityProp?.select?.name) {
          const prioritySelectName = priorityProp.select.name as string;
          // Extract P0/P1/P2/P3 prefix from select name (e.g., "P0 â€“ Critical" -> "P0")
          if (prioritySelectName.startsWith("P0")) priority = "P0";
          else if (prioritySelectName.startsWith("P1")) priority = "P1";
          else if (prioritySelectName.startsWith("P2")) priority = "P2";
          else if (prioritySelectName.startsWith("P3")) priority = "P3";
          else priority = prioritySelectName; // Fallback to full name if format unexpected
        } else if (typeof priorityProp?.number === "number") {
          // Convert legacy numeric priority to string format
          const numPriority = priorityProp.number as number;
          if (numPriority === 0) priority = "P0";
          else if (numPriority === 1) priority = "P1";
          else if (numPriority === 2) priority = "P2";
          else if (numPriority === 3) priority = "P3";
          else priority = `P${numPriority}`; // Fallback for other numbers
        } else if (
          priorityProp?.number !== undefined &&
          priorityProp?.number !== null
        ) {
          // Handle case where number might be stored differently
          const numPriority = Number(priorityProp.number);
          if (!isNaN(numPriority)) {
            if (numPriority === 0) priority = "P0";
            else if (numPriority === 1) priority = "P1";
            else if (numPriority === 2) priority = "P2";
            else if (numPriority === 3) priority = "P3";
            else priority = `P${numPriority}`;
          }
        }

        // Due date: prefer canonical "Due Date", fall back to legacy "Due"
        const due_date =
          props["Due Date"]?.date?.start || props.Due?.date?.start || null;

        // Optional Control Tower-aligned fields
        const mission_code =
          props["Mission Code"]?.rich_text?.[0]?.plain_text || null;

        // Entity: use detected property name or try common names
        let entity: string | null = null;
        if (entityPropertyName) {
          if (props[entityPropertyName]?.select?.name) {
            entity = props[entityPropertyName].select.name;
          } else if (props[entityPropertyName]?.relation?.[0]?.id) {
            // If it's a relation, we'd need to resolve it, but for now just note it exists
            entity = props[entityPropertyName].relation[0].id;
          }
        } else {
          entity =
            props.Entity?.select?.name ||
            props["Entity Registry"]?.select?.name ||
            null;
        }
        const room = props["Room / Primary Pod"]?.select?.name || null;
        const tags = Array.isArray(props.Tags?.multi_select)
          ? props.Tags.multi_select.map((t: any) => String(t.name))
          : [];

        // Owner: legacy people field; owner relation resolution is handled elsewhere
        const owner = props.Owner?.people?.[0]?.name || null;

        // Final safeguard: ensure priority is always a string or null (never a number)
        let finalPriority: string | null = priority;
        if (finalPriority !== null && typeof finalPriority !== "string") {
          // If somehow priority is still a number, convert it
          const numPriority = Number(finalPriority);
          if (!isNaN(numPriority)) {
            if (numPriority === 0) finalPriority = "P0";
            else if (numPriority === 1) finalPriority = "P1";
            else if (numPriority === 2) finalPriority = "P2";
            else if (numPriority === 3) finalPriority = "P3";
            else finalPriority = `P${numPriority}`;
          } else {
            finalPriority = null;
          }
        }

        // Debug: log first 3 missions to see what we're extracting
        const missionIndex = (result.results || []).indexOf(page);
        if (missionIndex < 3) {
          logger.info(`Mission ${missionIndex} extracted values`, {
            id: page.id,
            title,
            status,
            priority: finalPriority,
            titlePropertyName,
            hasTitleProp: !!props[titlePropertyName || ""],
            titlePropValue:
              props[titlePropertyName || ""]?.title?.[0]?.plain_text ||
              "NOT FOUND",
          });
        }

        return {
          id: page.id,
          title,
          status,
          priority: finalPriority,
          owner,
          due_date,
          last_edited_time: page.last_edited_time,
          mission_code,
          entity,
          room,
          tags,
        };
      });

      // Debug: Log summary of what we're returning
      logger.info("Returning missions list", {
        totalMissions: missions.length,
        sampleMission: missions[0]
          ? {
            id: missions[0].id,
            title: missions[0].title,
            status: missions[0].status,
            priority: missions[0].priority,
            priorityType: typeof missions[0].priority,
          }
          : null,
        missionsWithTitles: missions.filter((m) => m.title !== "Untitled")
          .length,
        missionsWithPriorities: missions.filter((m) => m.priority !== null)
          .length,
      });

      return { missions };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list missions", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list missions", {
        operation: "list_missions",
        originalError: String(error),
      });
    }
  }

  async listRooms(filters: any = {}) {
    try {
      logger.info("Starting listRooms", { filters });
      const dbId = this.config.NOTION_DB_ROOMS;
      if (!dbId) {
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_ROOMS not configured",
          { operation: "list_rooms" }
        );
      }

      const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 50;
      const andFilters: any[] = [];

      if (filters.query) {
        andFilters.push({
          property: "Name", // Title property for Rooms
          title: { contains: filters.query },
        });
      }

      const queryParams: any = {
        database_id: dbId,
        page_size: limit,
      };

      if (andFilters.length > 0) {
        queryParams.filter = andFilters.length === 1 ? andFilters[0] : { and: andFilters };
      }

      const result = await this.client.databases.query(queryParams);

      const rooms = result.results.map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          room_id: page.id,
          room_code: props["Room Code"]?.rich_text?.[0]?.plain_text ||
            props["Code"]?.rich_text?.[0]?.plain_text,
          room_name: props["Name"]?.title?.[0]?.plain_text || "Untitled",
          status: props["Status"]?.select?.name || props["Status"]?.status?.name,
          owner: props["Owner"]?.relation?.[0]?.id,
          entity_id: props["Entity"]?.relation?.[0]?.id || props["Entity Registry"]?.relation?.[0]?.id,
          created_at: page.created_time,
          updated_at: page.last_edited_time,
          notion_url: page.url,
        };
      });

      return { rooms };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list rooms", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list rooms", {
        operation: "list_rooms",
        originalError: String(error),
      });
    }
  }

  async listTasks(filters: any = {}) {
    try {
      logger.info("Starting listTasks", { filters });
      const dbId = this._getApprovedTasksDbId("list_tasks");

      const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 50;
      const andFilters: any[] = [];

      // Detect property names from schema
      let titlePropertyName = "Name";
      let statusPropertyName = "Status";
      let missionPropertyName = "Mission";
      let ownerPropertyName = "Owner";
      let statusPropertyType: "status" | "select" = "status";

      try {
        const dbSchema = await this.client.databases.retrieve({ database_id: dbId });
        const props = (dbSchema as any).properties || {};

        // Detect Title
        const titleProps = ["Name", "Task Title", "Title"];
        for (const name of titleProps) {
          if (props[name]?.type === "title") {
            titlePropertyName = name;
            break;
          }
        }

        // Detect Status
        const statusProps = ["Status", "State", "Stage"];
        for (const name of statusProps) {
          if (props[name]?.type === "status" || props[name]?.type === "select") {
            statusPropertyName = name;
            statusPropertyType = props[name].type === "status" ? "status" : "select";
            break;
          }
        }

        // Detect Mission Relation
        const missionProps = ["Mission", "Related Mission", "related_mission", "Related to Mission"];
        for (const name of missionProps) {
          if (props[name]?.type === "relation") {
            missionPropertyName = name;
            break;
          }
        }

        // Detect Owner
        const ownerProps = ["Owner", "Assignee", "Person"];
        for (const name of ownerProps) {
          if (props[name]?.type === "relation" || props[name]?.type === "people") {
            ownerPropertyName = name;
            break;
          }
        }
      } catch (e) {
        logger.warn("Failed to retrieve Tasks schema for property detection", { error: String(e) });
      }

      if (filters.mission_id) {
        andFilters.push({
          property: missionPropertyName,
          relation: { contains: filters.mission_id },
        });
      }

      if (filters.status) {
        const filterKey = statusPropertyType === "status" ? "status" : "select";
        andFilters.push({
          property: statusPropertyName,
          [filterKey]: { equals: filters.status },
        });
      }

      if (filters.owner) {
        andFilters.push({
          property: ownerPropertyName,
          relation: { contains: filters.owner },
        });
      }

      if (filters.query) {
        andFilters.push({
          property: titlePropertyName,
          title: { contains: filters.query },
        });
      }

      const queryParams: any = {
        database_id: dbId,
        page_size: limit,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      };

      if (andFilters.length > 0) {
        queryParams.filter = andFilters.length === 1 ? andFilters[0] : { and: andFilters };
      }

      logger.info("Executing listTasks query", {
        propertyNames: { titlePropertyName, statusPropertyName, missionPropertyName, ownerPropertyName, statusPropertyType },
        filter: queryParams.filter
      });
      const result = await this.client.databases.query(queryParams);

      const tasks = result.results.map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          task_id: page.id,
          title: props["Name"]?.title?.[0]?.plain_text ||
            props["Task Title"]?.title?.[0]?.plain_text || "Untitled",
          status: props["Status"]?.status?.name || props["Status"]?.select?.name,
          owner: props["Owner"]?.relation?.[0]?.id || props["Owner"]?.people?.[0]?.id,
          mission_id: props["Mission"]?.relation?.[0]?.id,
          entity_id: props["Entity"]?.relation?.[0]?.id,
          room_code: props["Room"]?.select?.name || props["Room Code"]?.rich_text?.[0]?.plain_text,
          due: props["Due"]?.date?.start || props["Due Date"]?.date?.start,
          priority: props["Priority"]?.select?.name || props["Priority"]?.number,
          created_at: page.created_time,
          updated_at: page.last_edited_time,
          notion_url: page.url,
        };
      });

      return { tasks };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list tasks", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list tasks", {
        operation: "list_tasks",
        originalError: String(error),
      });
    }
  }

  async ["pages.get"](pageId: string) {
    try {
      logger.info("Fetching page", { pageId });
      const page = (await this.client.pages.retrieve({
        page_id: pageId,
      })) as any;
      return {
        id: page.id,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        properties: page.properties,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        throw new MCPError(ErrorCodes.NOT_FOUND, `Page not found: ${pageId}`, {
          operation: "get_page",
          pageId,
        });
      }
      logger.error("Failed to fetch page", error, { pageId });
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to fetch page", {
        operation: "get_page",
        pageId,
        originalError: String(error),
      });
    }
  }

  async upsertMissionDoc(
    missionData: Record<string, unknown>,
    existingPageId?: string
  ) {
    try {
      const dbId = this.config.NOTION_DB_MISSIONS;
      if (!dbId) {
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_MISSIONS not configured",
          {
            operation: "upsert_mission_doc",
          }
        );
      }

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);

      logger.info("Upserting mission document", {
        missionId: (missionData as any).id,
        existingPageId,
      });
      if (existingPageId) {
        const updated = await this.client.pages.update({
          page_id: existingPageId,
          properties: this._formatNotionProperties(missionData),
        } as any);
        logger.info("Mission document updated", { pageId: updated.id });
        return updated;
      } else {
        const created = await this.client.pages.create({
          parent: { database_id: dbId },
          properties: this._formatNotionProperties(missionData),
        } as any);
        logger.info("Mission document created", { pageId: created.id });
        return created;
      }
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to upsert mission document", error, { missionData });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to upsert mission document",
        {
          operation: "upsert_mission_doc",
          originalError: String(error),
        }
      );
    }
  }

  /**
   * Upsert a mission using the canonical TEAM AI mission payload and [WAR] Missions schema.
   *
   * missionData: canonical payload (mission_title, mission_description, mission_objective, etc.)
   * upsert:
   *   - notion_page_id: direct target page to update
   *   - mission_code:   if exactly one match in "Mission Code", update that page, else create
   */
  async ["missions.upsert"](
    missionData: Record<string, unknown>,
    upsert?: {
      notion_page_id?: string;
      mission_code?: string;
      userContext?: { userId?: string; userHandle?: string; userName?: string };
    }
  ) {
    try {
      const dbId = this.config.NOTION_DB_MISSIONS;
      if (!dbId) {
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_MISSIONS not configured",
          { operation: "mission_upsert" }
        );
      }

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);

      let targetPageId: string | undefined = upsert?.notion_page_id;

      // If no explicit page ID but a mission_code is provided, try to resolve uniquely
      if (!targetPageId && upsert?.mission_code) {
        const q = await this.client.databases.query({
          database_id: dbId,
          filter: {
            property: "Mission Code",
            rich_text: { equals: upsert.mission_code },
          },
        });
        if (q.results.length === 1) {
          targetPageId = (q.results[0] as any).id;
        }
      }

      // Optional owner relation resolution against [TEAM AI People]
      let ownerRelationId: string | undefined;
      const ownerValue = (missionData as any).owner as string | undefined;
      if (ownerValue && this.config.NOTION_DB_TEAM_AI_PEOPLE) {
        ownerRelationId = await this._resolveOwnerRelation(ownerValue);
      }

      // Detect Status property type (select vs status)
      let statusPropertyType: "select" | "status" = "select";
      try {
        const dbSchema = await this.client.databases.retrieve({
          database_id: dbId,
        });
        const properties = (dbSchema as any).properties || {};
        if (properties.Status) {
          statusPropertyType =
            properties.Status.type === "status" ? "status" : "select";
        }
      } catch (schemaError) {
        logger.warn(
          "Failed to detect Status property type, defaulting to select",
          {
            error: String(schemaError),
          }
        );
      }

      const properties = this._formatCanonicalMissionProperties(
        missionData,
        ownerRelationId,
        statusPropertyType
      );

      let page: any;
      const isNewMission = !targetPageId;

      if (targetPageId) {
        page = await this.client.pages.update({
          page_id: targetPageId,
          properties,
        } as any);
      } else {
        page = await this.client.pages.create({
          parent: { database_id: dbId },
          properties,
        } as any);
      }

      // Ensure priority is always a string for frontend compatibility
      let priority: string | null = null;
      const missionPriority = (missionData as any).priority;
      if (missionPriority !== null && missionPriority !== undefined) {
        if (typeof missionPriority === "string") {
          priority = missionPriority;
        } else if (typeof missionPriority === "number") {
          // Convert numeric priority to string format
          if (missionPriority === 0) priority = "P0";
          else if (missionPriority === 1) priority = "P1";
          else if (missionPriority === 2) priority = "P2";
          else if (missionPriority === 3) priority = "P3";
          else priority = `P${missionPriority}`;
        }
      }

      // Emit Timeline event
      try {
        const eventType = isNewMission ? "MISSION_CREATED" : "MISSION_UPDATED";
        const missionTitle = (missionData as any).mission_title || "Untitled";
        const entity = (missionData as any).entity;
        const room = (missionData as any).room;
        const syncKey = (missionData as any).sync_key;

        // Build summary for MISSION_UPDATED (list changed fields)
        let summary: string | undefined;
        if (!isNewMission) {
          const changedFields: string[] = [];
          if ((missionData as any).status) changedFields.push("status");
          if ((missionData as any).priority) changedFields.push("priority");
          if ((missionData as any).entity) changedFields.push("entity");
          if ((missionData as any).room) changedFields.push("room");
          if ((missionData as any).due_date) changedFields.push("due_date");
          summary =
            changedFields.length > 0
              ? `Updated: ${changedFields.join(", ")}`
              : "Mission updated";
        }

        // Resolve actor for mission events
        const actorId = await this._resolveActor(upsert?.userContext);

        await this.logTimelineEvent({
          title: entity
            ? `[${entity}] ${eventType} â€” ${missionTitle}`
            : `${eventType} â€” ${missionTitle}`,
          event_type: eventType,
          timestamp: new Date().toISOString(),
          entity,
          room,
          missionId: page.id,
          actor_people_id: actorId,
          sync_key: syncKey,
          summary,
          external_refs: this._generateExternalRefs(
            (page as any).url,
            `/missions/${page.id}`
          ),
          source: "INOS Shell",
        });
      } catch (timelineError) {
        // Log but don't fail the mission upsert if timeline logging fails
        logger.warn("Failed to log timeline event for mission", {
          missionId: page.id,
          error: timelineError,
        });
      }

      return {
        notion_page_id: page.id,
        mission_url: (page as any).url,
        mission_title: (missionData as any).mission_title,
        status: (missionData as any).status ?? null,
        priority,
        created_at: page.created_time,
        last_updated_at: page.last_edited_time,
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to upsert canonical mission", error, {
        missionData,
        upsert,
      });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to upsert mission",
        {
          operation: "mission_upsert",
          originalError: String(error),
        }
      );
    }
  }

  /**
   * Format canonical mission payload into [WAR] Missions property map.
   *
   * This assumes the [WAR] Missions DB follows the schema described in
   * ALIGN_WAR_MISSIONS_STACK_V1 (Mission Title, Mission Description, etc.).
   */
  private _formatCanonicalMissionProperties(
    data: Record<string, unknown>,
    ownerRelationId?: string,
    statusPropertyType: "select" | "status" = "select"
  ) {
    const payload = data as any;

    // Map priority enums (P0..P3) into [WAR] Missions emoji select values
    const priorityMap: Record<string, string> = {
      P0: "ðŸ”´ Critical",
      P1: "ðŸŸ  High",
      P2: "ðŸŸ¡ Medium",
      P3: "ðŸŸ¢ Low",
    };

    // Map canonical status enum to [WAR] Missions Railway Stage values
    const canonicalToNotionStatus: Record<string, string> = {
      Proposed: "Intake",
      Intake: "Intake",
      Planning: "Brief",
      Active: "In Progress",
      "In Flight": "In Progress",
      Blocked: "In Progress", // no Blocked stage; stays In Progress
      Complete: "Complete",
      Done: "Complete",
      Canceled: "Cancelled",
      Archived: "Archived",
      Parked: "Archived",
    };

    const rawStatus =
      typeof payload.status === "string" ? payload.status : undefined;
    // Map canonical status to Notion status, or use as-is if already a Notion status
    const statusValue = rawStatus
      ? canonicalToNotionStatus[rawStatus] || rawStatus
      : undefined;

    const priorityValue =
      typeof payload.priority === "string"
        ? priorityMap[payload.priority] || payload.priority
        : undefined;

    const properties: any = {
      // Title & core text fields
      "Mission Title": {
        title: [
          {
            text: {
              content: String(payload.mission_title || "Untitled"),
            },
          },
        ],
      },
      "Mission Description": payload.mission_description
        ? {
          rich_text: [
            {
              text: { content: String(payload.mission_description) },
            },
          ],
        }
        : undefined,
      "Mission Objective": payload.mission_objective
        ? {
          rich_text: [
            {
              text: { content: String(payload.mission_objective) },
            },
          ],
        }
        : undefined,
      "Mission Brief (Raw)": payload.brief_raw
        ? {
          rich_text: [
            {
              text: { content: String(payload.brief_raw) },
            },
          ],
        }
        : undefined,

      // Codes / identifiers
      "Mission Code": payload.mission_code
        ? {
          rich_text: [
            {
              text: { content: String(payload.mission_code) },
            },
          ],
        }
        : undefined,
      SYNC_KEY: payload.sync_key
        ? {
          rich_text: [
            {
              text: { content: String(payload.sync_key) },
            },
          ],
        }
        : undefined,

      // Status / priority
      Status: statusValue
        ? statusPropertyType === "status"
          ? { status: { name: statusValue } }
          : { select: { name: statusValue } }
        : undefined,
      Priority: priorityValue ? { select: { name: priorityValue } } : undefined,

      // Pod / entity / tags
      "Pod / Domain": payload.room
        ? { select: { name: String(payload.room) } }
        : undefined,
      Entity: Array.isArray(payload.entity)
        ? { multi_select: payload.entity.map((e: unknown) => ({ name: String(e) })) }
        : payload.entity
        ? { multi_select: [{ name: String(payload.entity) }] }
        : undefined,
      Tags: Array.isArray(payload.tags)
        ? {
          multi_select: payload.tags.map((t: unknown) => ({
            name: String(t),
          })),
        }
        : undefined,

      // Dates
      "Start Date": payload.start_date
        ? { date: { start: String(payload.start_date) } }
        : undefined,
      "Due Date": payload.due_date
        ? { date: { start: String(payload.due_date) } }
        : undefined,

      // Type / source / created_by
      "Mission Type": payload.mission_type
        ? { select: { name: String(payload.mission_type) } }
        : undefined,
      "Source System": payload.source_system
        ? { select: { name: String(payload.source_system) } }
        : undefined,
      "Created By": payload.created_by
        ? {
          rich_text: [
            {
              text: { content: String(payload.created_by) },
            },
          ],
        }
        : undefined,

      // External references
      "External Refs": payload.external_refs
        ? {
          rich_text: [
            {
              text: { content: String(payload.external_refs) },
            },
          ],
        }
        : undefined,

      // Owner relation (to [TEAM AI People])
      Owner: ownerRelationId
        ? {
          relation: [{ id: ownerRelationId }],
        }
        : undefined,
    };

    // Strip undefineds so we don't clobber properties unintentionally
    Object.keys(properties).forEach((key) => {
      if (properties[key] === undefined) delete properties[key];
    });

    return properties;
  }

  /**
   * Resolve an owner handle/name to a single [TEAM AI People] page ID.
   *
   * - First tries Handle (rich_text)
   * - Then falls back to Name (title)
   * - Only returns when exactly one match; otherwise returns undefined
   */
  /**
   * Resolve owner/actor relation with strict search order (deterministic)
   * Search order:
   * 1) Handle (rich_text) exact match
   * 2) Name (title) exact match
   * Returns undefined if no match (no auto-creation)
   */
  private async _resolveOwnerRelation(
    owner: string
  ): Promise<string | undefined> {
    // Try NOTION_DB_AGENTS first (canonical), then fallback to NOTION_DB_TEAM_AI_PEOPLE
    const peopleDbId =
      this.config.NOTION_DB_AGENTS || this.config.NOTION_DB_TEAM_AI_PEOPLE;
    if (!peopleDbId) {
      logger.warn(
        "Cannot resolve owner: NOTION_DB_AGENTS or NOTION_DB_TEAM_AI_PEOPLE not configured"
      );
      return undefined;
    }

    // 1) Try Handle equals (strict search order)
    try {
      const byHandle = await this.client.databases.query({
        database_id: peopleDbId,
        filter: {
          property: "Handle",
          rich_text: { equals: owner },
        },
      });
      if (byHandle.results.length === 1) {
        return (byHandle.results[0] as any).id;
      }
      if (byHandle.results.length > 1) {
        logger.warn(
          "Multiple matches found for Handle, cannot resolve owner deterministically",
          { owner, matchCount: byHandle.results.length }
        );
        return undefined;
      }
    } catch (error) {
      // Property might not exist, continue to next search method
      logger.debug("Handle property query failed, trying Name", {
        error: String(error),
      });
    }

    // 2) Try Name equals (strict search order)
    try {
      const byName = await this.client.databases.query({
        database_id: peopleDbId,
        filter: {
          property: "Name",
          title: { equals: owner },
        },
      });
      if (byName.results.length === 1) {
        return (byName.results[0] as any).id;
      }
      if (byName.results.length > 1) {
        logger.warn(
          "Multiple matches found for Name, cannot resolve owner deterministically",
          { owner, matchCount: byName.results.length }
        );
        return undefined;
      }
    } catch (error) {
      logger.warn("Name property query failed", { error: String(error) });
    }

    // No match found - return undefined (no auto-creation)
    return undefined;
  }

  /**
   * Resolve entity from Entity Registry (strict search order)
   * Search order:
   * 1) Entity Code/Handle exact match
   * 2) Entity Name exact match
   * Returns undefined if no match (no auto-creation)
   */
  private async _resolveEntityRelation(
    entity: string
  ): Promise<string | undefined> {
    const entitiesDbId = this.config.NOTION_DB_ENTITIES;
    if (!entitiesDbId) {
      logger.warn("Cannot resolve entity: NOTION_DB_ENTITIES not configured");
      return undefined;
    }

    // Try common property names for entity identifier
    const codeProps = ["Code", "Handle", "Entity Code"];
    for (const propName of codeProps) {
      try {
        const byCode = await this.client.databases.query({
          database_id: entitiesDbId,
          filter: {
            property: propName,
            rich_text: { equals: entity },
          },
        });
        if (byCode.results.length === 1) {
          return (byCode.results[0] as any).id;
        }
        if (byCode.results.length > 1) {
          logger.warn(
            `Multiple matches found for ${propName}, cannot resolve entity deterministically`,
            { entity, matchCount: byCode.results.length }
          );
          return undefined;
        }
      } catch (error) {
        // Property might not exist, continue to next property
        continue;
      }
    }

    // Try Name property
    try {
      const byName = await this.client.databases.query({
        database_id: entitiesDbId,
        filter: {
          property: "Name",
          title: { equals: entity },
        },
      });
      if (byName.results.length === 1) {
        return (byName.results[0] as any).id;
      }
      if (byName.results.length > 1) {
        logger.warn(
          "Multiple matches found for Name, cannot resolve entity deterministically",
          { entity, matchCount: byName.results.length }
        );
        return undefined;
      }
    } catch (error) {
      logger.warn("Name property query failed for entity", {
        error: String(error),
      });
    }

    // No match found - return undefined (no auto-creation)
    return undefined;
  }

  private _formatNotionProperties(data: Record<string, unknown>) {
    const due = (data as any).due_date || (data as any).due_at;
    return {
      Name: {
        title: [
          { text: { content: String((data as any).title || "Untitled") } },
        ],
      },
      Status: {
        select: { name: String((data as any).status || "Not Started") },
      },
      Priority:
        typeof (data as any).priority === "number"
          ? { number: (data as any).priority }
          : undefined,
      Due: due ? { date: { start: String(due) } } : undefined,
    } as any;
  }

  async ["tasks.create"](params: {
    missionId: string;
    taskTitle: string;
    status?: string;
    priority?: string;
    due_date?: string;
    tags?: string[];
    notes?: string;
    source_system?: string;
    userContext?: { userId?: string; userHandle?: string; userName?: string };
  }) {
    try {
      const dbId = this._getApprovedTasksDbId("create_task_for_mission");

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);

      // Detect Tasks DB schema property names
      let titlePropertyName: string | null = null;
      let missionPropertyName: string | null = null;
      let statusPropertyName: string | null = null;
      let statusPropertyType: "select" | "status" = "select";
      let statusOptions: string[] = [];
      let priorityPropertyName: string | null = null;
      let priorityPropertyType: "select" | "number" = "select";
      let dueDatePropertyName: string | null = null;
      let tagsPropertyName: string | null = null;
      let notesPropertyName: string | null = null;

      try {
        const dbSchema = await this.client.databases.retrieve({
          database_id: dbId,
        });
        const properties = (dbSchema as any).properties || {};

        // Find title property
        const titleProps = ["Task Title", "Title", "Name"];
        for (const name of titleProps) {
          if (properties[name] && properties[name].type === "title") {
            titlePropertyName = name;
            break;
          }
        }
        if (!titlePropertyName) {
          for (const [propName, propDef] of Object.entries(properties)) {
            if ((propDef as any).type === "title") {
              titlePropertyName = propName;
              break;
            }
          }
        }

        // Find mission relation property
        const missionProps = [
          "Mission",
          "Related Mission",
          "related_mission",
          "Related to Mission",
        ];
        for (const name of missionProps) {
          if (properties[name] && properties[name].type === "relation") {
            missionPropertyName = name;
            break;
          }
        }
        if (!missionPropertyName) {
          for (const [propName, propDef] of Object.entries(properties)) {
            if (
              (propDef as any).type === "relation" &&
              propName.toLowerCase().includes("mission")
            ) {
              missionPropertyName = propName;
              break;
            }
          }
        }

        // Find status property (select or status type) and get valid options
        const statusProps = ["Status", "State"];
        for (const name of statusProps) {
          if (
            properties[name] &&
            (properties[name].type === "select" ||
              properties[name].type === "status")
          ) {
            statusPropertyName = name;
            statusPropertyType =
              properties[name].type === "status" ? "status" : "select";
            // Get valid status options (update the outer statusOptions array)
            statusOptions.length = 0; // Clear first
            if (
              properties[name].type === "select" &&
              (properties[name] as any).select?.options
            ) {
              statusOptions.push(
                ...(properties[name] as any).select.options.map(
                  (opt: any) => opt.name
                )
              );
            } else if (
              properties[name].type === "status" &&
              (properties[name] as any).status?.options
            ) {
              statusOptions.push(
                ...(properties[name] as any).status.options.map(
                  (opt: any) => opt.name
                )
              );
            }
            break;
          }
        }
        if (!statusPropertyName) {
          for (const [propName, propDef] of Object.entries(properties)) {
            if (
              ((propDef as any).type === "select" ||
                (propDef as any).type === "status") &&
              propName.toLowerCase().includes("status")
            ) {
              statusPropertyName = propName;
              statusPropertyType =
                (propDef as any).type === "status" ? "status" : "select";
              // Get valid status options (update the outer statusOptions array)
              statusOptions.length = 0; // Clear first
              if (
                (propDef as any).type === "select" &&
                (propDef as any).select?.options
              ) {
                statusOptions.push(
                  ...(propDef as any).select.options.map((opt: any) => opt.name)
                );
              } else if (
                (propDef as any).type === "status" &&
                (propDef as any).status?.options
              ) {
                statusOptions.push(
                  ...(propDef as any).status.options.map((opt: any) => opt.name)
                );
              }
              break;
            }
          }
        }

        // Find priority property
        const priorityProps = ["Priority"];
        for (const name of priorityProps) {
          if (
            properties[name] &&
            (properties[name].type === "select" ||
              properties[name].type === "number")
          ) {
            priorityPropertyName = name;
            priorityPropertyType =
              properties[name].type === "number" ? "number" : "select";
            break;
          }
        }

        // Find due date property
        const dueDateProps = ["Due Date", "Due", "Deadline"];
        for (const name of dueDateProps) {
          if (properties[name] && properties[name].type === "date") {
            dueDatePropertyName = name;
            break;
          }
        }

        // Find tags property
        for (const [propName, propDef] of Object.entries(properties)) {
          if (
            (propDef as any).type === "multi_select" &&
            (propName.toLowerCase().includes("tag") ||
              propName.toLowerCase().includes("label"))
          ) {
            tagsPropertyName = propName;
            break;
          }
        }

        // Find notes property
        const notesProps = ["Notes", "Description", "Acceptance Check"];
        for (const name of notesProps) {
          if (properties[name] && properties[name].type === "rich_text") {
            notesPropertyName = name;
            break;
          }
        }

        logger.info("Detected Tasks DB property names", {
          title: titlePropertyName,
          mission: missionPropertyName,
          status: statusPropertyName,
          statusType: statusPropertyType,
          statusOptions: statusOptions,
          priority: priorityPropertyName,
          priorityType: priorityPropertyType,
          dueDate: dueDatePropertyName,
          tags: tagsPropertyName,
          notes: notesPropertyName,
        });
      } catch (schemaError) {
        logger.warn("Failed to retrieve Tasks DB schema, using defaults", {
          error: String(schemaError),
        });
        // Fallback to common names
        titlePropertyName = "Task Title";
        missionPropertyName = "Mission";
        statusPropertyName = "Status";
        dueDatePropertyName = "Due Date";
        tagsPropertyName = "Tags";
        notesPropertyName = "Notes";
      }

      // Build properties using detected names
      const properties: any = {};

      if (titlePropertyName) {
        properties[titlePropertyName] = {
          title: [{ text: { content: params.taskTitle } }],
        };
      }

      if (missionPropertyName && params.missionId) {
        properties[missionPropertyName] = {
          relation: [{ id: params.missionId }],
        };
      }

      if (statusPropertyName && params.status) {
        // Map UI status to valid Notion status
        const providedStatus = params.status;
        let mappedStatus: string | null = null;

        // Common status mappings (always apply these)
        const statusMap: Record<string, string> = {
          Todo: "Not Started",
          "Not Started": "Not Started",
          Doing: "In Progress",
          "In Progress": "In Progress",
          Blocked: "Blocked",
          Done: "Done",
          Complete: "Complete",
          Canceled: "Canceled",
          Cancelled: "Canceled",
        };

        // Try mapping first
        const mapped =
          statusMap[providedStatus] || statusMap[providedStatus.toLowerCase()];

        // If we have valid status options from schema detection
        if (statusOptions.length > 0) {
          // Try exact match first (case-insensitive)
          const exactMatch = statusOptions.find(
            (opt) => opt.toLowerCase() === providedStatus.toLowerCase()
          );
          if (exactMatch) {
            mappedStatus = exactMatch;
          } else if (mapped && statusOptions.includes(mapped)) {
            // Use mapped value ONLY if it exists in valid options
            mappedStatus = mapped;
          } else {
            // Try partial match
            const partialMatch = statusOptions.find(
              (opt) =>
                opt.toLowerCase().includes(providedStatus.toLowerCase()) ||
                providedStatus.toLowerCase().includes(opt.toLowerCase())
            );
            if (partialMatch) {
              mappedStatus = partialMatch;
            } else {
              // Fallback to first available option (always safe)
              logger.warn(
                "Status value not found in valid options, using first option",
                {
                  provided: providedStatus,
                  mapped: mapped,
                  validOptions: statusOptions,
                }
              );
              mappedStatus = statusOptions[0];
            }
          }
        } else {
          // No status options detected - skip status to avoid errors
          logger.warn("No status options detected, skipping status property", {
            provided: providedStatus,
            mapped: mapped,
          });
          mappedStatus = null; // Skip status if we can't validate it
        }

        if (mappedStatus) {
          properties[statusPropertyName] =
            statusPropertyType === "status"
              ? { status: { name: mappedStatus } }
              : { select: { name: mappedStatus } };
        }
      }

      if (priorityPropertyName && params.priority) {
        if (priorityPropertyType === "number") {
          // Convert priority string to number if needed
          const priorityNum = params.priority.startsWith("P")
            ? parseInt(params.priority.substring(1), 10)
            : parseInt(params.priority, 10);
          if (!isNaN(priorityNum)) {
            properties[priorityPropertyName] = { number: priorityNum };
          }
        } else {
          properties[priorityPropertyName] = {
            select: { name: params.priority },
          };
        }
      }

      if (dueDatePropertyName && params.due_date) {
        properties[dueDatePropertyName] = { date: { start: params.due_date } };
      }

      if (
        tagsPropertyName &&
        Array.isArray(params.tags) &&
        params.tags.length > 0
      ) {
        properties[tagsPropertyName] = {
          multi_select: params.tags.map((t) => ({ name: String(t) })),
        };
      }

      if (notesPropertyName && params.notes) {
        properties[notesPropertyName] = {
          rich_text: [{ text: { content: params.notes } }],
        };
      }

      Object.keys(properties).forEach((key) => {
        if (properties[key] === undefined) delete properties[key];
      });

      const page = await this.client.pages.create({
        parent: { database_id: dbId },
        properties,
      } as any);

      // Emit TASK_CREATED timeline event
      try {
        // Get mission info for timeline event
        let missionEntity: string | undefined;
        let missionRoom: string | undefined;
        let missionSyncKey: string | undefined;
        try {
          const missions = await this.listMissions();
          const mission = missions.missions.find(
            (m) => m.id === params.missionId
          );
          if (mission) {
            missionEntity = mission.entity || undefined;
            missionRoom = mission.room || undefined;
          }
        } catch (err) {
          logger.warn("Failed to fetch mission for timeline event", { err });
        }

        const actorId = await this._resolveActor(params.userContext);

        await this.logTimelineEvent({
          title: missionEntity
            ? `[${missionEntity}] TASK_CREATED â€” ${params.taskTitle}`
            : `TASK_CREATED â€” ${params.taskTitle}`,
          event_type: "TASK_CREATED",
          timestamp: new Date().toISOString(),
          entity: missionEntity,
          room: missionRoom,
          missionId: params.missionId,
          task_id: page.id,
          actor_people_id: actorId,
          sync_key: missionSyncKey,
          summary: `Task created: ${params.taskTitle}`,
          external_refs: this._generateExternalRefs(
            (page as any).url,
            `/tasks/${page.id}`
          ),
          source: params.source_system || "INOS Shell",
        });
      } catch (timelineError) {
        // Log but don't fail the task creation if timeline logging fails
        logger.warn("Failed to log timeline event for task", {
          taskId: page.id,
          error: timelineError,
        });
      }

      return { id: page.id, url: (page as any).url };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to create task for mission", error, { params });
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to create task", {
        operation: "create_task_for_mission",
        originalError: String(error),
      });
    }
  }

  async ["tasks.update"](params: {
    taskId: string;
    missionId?: string;
    taskTitle?: string;
    status?: string;
    priority?: string;
    due_date?: string;
    notes?: string;
    userContext?: { userId?: string; userHandle?: string; userName?: string };
  }) {
    try {
      const dbId = this._getApprovedTasksDbId("update_task_for_mission");

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);

      const properties: any = {};
      if (params.taskTitle) {
        properties["Task Title"] = {
          title: [{ text: { content: params.taskTitle } }],
        };
      }
      if (params.status) {
        properties.Status = { select: { name: params.status } };
      }
      if (params.priority) {
        properties.Priority = { select: { name: params.priority } };
      }
      if (params.due_date) {
        properties["Due Date"] = { date: { start: params.due_date } };
      }
      if (params.notes) {
        properties.Notes = {
          rich_text: [{ text: { content: params.notes } }],
        };
      }

      const page = await this.client.pages.update({
        page_id: params.taskId,
        properties,
      } as any);

      // Emit TASK_UPDATED timeline event
      try {
        const missionId = params.missionId;
        if (missionId) {
          let missionEntity: string | undefined;
          let missionRoom: string | undefined;
          try {
            const missions = await this.listMissions();
            const mission = missions.missions.find((m) => m.id === missionId);
            if (mission) {
              missionEntity = mission.entity || undefined;
              missionRoom = mission.room || undefined;
            }
          } catch (err) {
            logger.warn("Failed to fetch mission for timeline event", { err });
          }

          const changedFields: string[] = [];
          if (params.taskTitle) changedFields.push("title");
          if (params.status) changedFields.push("status");
          if (params.priority) changedFields.push("priority");
          if (params.due_date) changedFields.push("due_date");
          if (params.notes) changedFields.push("notes");

          const actorId = await this._resolveActor(params.userContext);

          await this.logTimelineEvent({
            title: missionEntity
              ? `[${missionEntity}] TASK_UPDATED â€” ${params.taskTitle || "Task"
              }`
              : `TASK_UPDATED â€” ${params.taskTitle || "Task"}`,
            event_type: "TASK_UPDATED",
            timestamp: new Date().toISOString(),
            entity: missionEntity,
            room: missionRoom,
            missionId,
            task_id: params.taskId,
            actor_people_id: actorId,
            summary:
              changedFields.length > 0
                ? `Updated: ${changedFields.join(", ")}`
                : "Task updated",
            external_refs: this._generateExternalRefs(
              (page as any).url,
              `/tasks/${page.id}`
            ),
            source: "INOS Shell",
          });
        }
      } catch (timelineError) {
        logger.warn("Failed to log timeline event for task update", {
          taskId: params.taskId,
          error: timelineError,
        });
      }

      return { id: page.id, url: (page as any).url };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to update task", error, { params });
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to update task", {
        operation: "update_task_for_mission",
        originalError: String(error),
      });
    }
  }

  /**
   * Helper to resolve current actor (user) for timeline events
   * Falls back to a default or can be set via context
   */
  private async _resolveActor(userContext?: {
    userId?: string;
    userHandle?: string;
    userName?: string;
  }): Promise<string | undefined> {
    // If user context is provided, try to resolve actor from it
    if (userContext) {
      // Try to resolve by handle first (most common)
      if (userContext.userHandle) {
        const resolved = await this._resolveOwnerRelation(
          userContext.userHandle
        );
        if (resolved) return resolved;
      }
      // Try by name
      if (userContext.userName) {
        const resolved = await this._resolveOwnerRelation(userContext.userName);
        if (resolved) return resolved;
      }
      // Try by userId (if it's a Notion page ID)
      if (userContext.userId) {
        // Check if it's already a valid Notion page ID format
        if (/^[a-f0-9]{32}$/i.test(userContext.userId)) {
          return userContext.userId;
        }
        // Otherwise try to resolve it as a handle/name
        const resolved = await this._resolveOwnerRelation(userContext.userId);
        if (resolved) return resolved;
      }
    }

    // Fallback: Try to get from environment variable (for system actors)
    const defaultActor = process.env.NOTION_DEFAULT_ACTOR_ID;
    if (defaultActor) {
      return defaultActor;
    }

    // No actor resolved - return undefined (actor field will be optional)
    return undefined;
  }

  /**
   * Helper to generate external refs string with Notion URLs and shell routes
   */
  private _generateExternalRefs(
    notionUrl?: string,
    shellRoute?: string
  ): string | undefined {
    const refs: string[] = [];
    if (notionUrl) {
      refs.push(`Notion: ${notionUrl}`);
    }
    if (shellRoute) {
      refs.push(`Shell: ${shellRoute}`);
    }
    return refs.length > 0 ? refs.join(" | ") : undefined;
  }

  /**
   * Emit BLOCKER_EVENT when WAR Stamp gates fail
   * This is the canonical PoLE event for gate failures
   */
  private async _emitBlockerEvent(params: {
    missionId: string;
    gateFailures: string[]; // e.g., ["entity_not_resolved", "owner_not_resolved"]
    syncKey?: string;
    entity?: string;
    room?: string;
    actorId?: string;
  }): Promise<void> {
    try {
      const missions = await this.listMissions();
      const mission = missions.missions.find((m) => m.id === params.missionId);
      if (!mission) {
        logger.warn("Cannot emit BLOCKER_EVENT: mission not found", {
          missionId: params.missionId,
        });
        return;
      }

      const summary = `Gate failures: ${params.gateFailures.join(", ")}`;
      await this.logTimelineEvent({
        title: mission.entity
          ? `[${mission.entity}] BLOCKER_EVENT â€” ${mission.title}`
          : `BLOCKER_EVENT â€” ${mission.title}`,
        event_type: "BLOCKER_EVENT",
        timestamp: new Date().toISOString(),
        entity: params.entity || mission.entity || undefined,
        room: params.room || mission.room || undefined,
        missionId: params.missionId,
        actor_people_id: params.actorId,
        sync_key: params.syncKey || mission.mission_code || undefined,
        summary,
        source: "INOS Shell",
      });
    } catch (error) {
      // Log but don't fail the operation if BLOCKER_EVENT emission fails
      logger.warn("Failed to emit BLOCKER_EVENT", {
        missionId: params.missionId,
        gateFailures: params.gateFailures,
        error: String(error),
      });
    }
  }

  /**
   * Create a mission run (start execution)
   * Creates a single Mission Run row. AAR activity is written back to the same row.
   */
  async ["runs.create"](params: {
    missionId: string;
    runTitle?: string;
    notes?: string;
    startedBy?: string;
    userContext?: { userId?: string; userHandle?: string; userName?: string };
  }) {
    try {
      const dbId = this._getMissionRunsDbId("create_run");

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);
      await this._assertWritableDatabaseSurface(dbId, "create_run");

      // Get mission info
      const missions = await this.listMissions();
      const mission = missions.missions.find((m) => m.id === params.missionId);
      if (!mission) {
        throw new MCPError(ErrorCodes.BAD_REQUEST, "Mission not found", {
          operation: "create_run",
          missionId: params.missionId,
        });
      }

      const runLabel = params.runTitle || `RUN-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
      const now = new Date().toISOString();
      const runSyncKey = `MISSION_RUN_${now}_${params.missionId}`;

      // Create live Mission Run entry
      const runProperties: any = {
        "Run ID": { title: [{ text: { content: runLabel } }] },
        Mission: { relation: [{ id: params.missionId }] },
        "Started At": { date: { start: now } },
        Status: { select: { name: "In Progress" } },
        SYNC_KEY: { rich_text: [{ text: { content: runSyncKey } }] },
        "Output Summary": {
          rich_text: [{ text: { content: params.notes || `Run started for ${mission.title}` } }],
        },
      };
      const missionRunType = await this._resolveSelectOptionName(dbId, "Run Type", [
        "Automation Run",
        "Analysis",
        "Transformation",
      ]);
      if (missionRunType) {
        runProperties["Run Type"] = { select: { name: missionRunType } };
      }

      const runPage = await this.client.pages.create({
        parent: { database_id: dbId },
        properties: runProperties,
      } as any);

      // Resolve actor
      const actorId = params.startedBy
        ? await this._resolveOwnerRelation(params.startedBy)
        : await this._resolveActor(params.userContext);

      // Emit RUN_STARTED timeline event
      try {
        await this.logTimelineEvent({
          title: mission.entity
            ? `[${mission.entity}] RUN_STARTED â€” ${mission.title}`
            : `RUN_STARTED â€” ${mission.title}`,
          event_type: "RUN_STARTED",
          timestamp: now,
          entity: mission.entity || undefined,
          room: mission.room || undefined,
          missionId: params.missionId,
          run_id: runPage.id,
          actor_people_id: actorId,
          sync_key: `RUN_STARTED_${runPage.id}`,
          summary: `Run started: ${runLabel}`,
          external_refs: this._generateExternalRefs(
            (runPage as any).url,
            `/runs/${runPage.id}`
          ),
          source: "INOS Shell",
        });
      } catch (timelineError) {
        logger.warn("Failed to log RUN_STARTED timeline event", {
          runId: runPage.id,
          error: timelineError,
        });
      }

      // Emit AAR_CREATED timeline event
      try {
        await this.logTimelineEvent({
          title: mission.entity
            ? `[${mission.entity}] AAR_CREATED â€” ${mission.title}`
            : `AAR_CREATED â€” ${mission.title}`,
          event_type: "AAR_CREATED",
          timestamp: now,
          entity: mission.entity || undefined,
          room: mission.room || undefined,
          missionId: params.missionId,
          run_id: runPage.id,
          aar_id: runPage.id,
          actor_people_id: actorId,
          sync_key: `AAR_CREATED_${runPage.id}`,
          summary: `AAR initialized on mission run row`,
          external_refs: this._generateExternalRefs(
            (runPage as any).url,
            `/aars/${runPage.id}`
          ),
          source: "INOS Shell",
        });
      } catch (timelineError) {
        logger.warn("Failed to log AAR_CREATED timeline event", {
          aarId: runPage.id,
          error: timelineError,
        });
      }

      return {
        run: { id: runPage.id, url: (runPage as any).url },
        aar: { id: runPage.id, url: (runPage as any).url },
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to create run", error, { params });
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to create run", {
        operation: "create_run",
        originalError: String(error),
      });
    }
  }

  /**
   * End a mission run
   * Updates run status and emits RUN_ENDED event
   */
  async ["runs.end"](params: {
    runId: string;
    endedBy?: string;
    endNotes?: string;
    userContext?: { userId?: string; userHandle?: string; userName?: string };
  }) {
    try {
      const dbId = this._getMissionRunsDbId("end_run");

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);
      await this._assertWritableDatabaseSurface(dbId, "end_run");

      const now = new Date().toISOString();

      // Update run status
      const runPage = await this.client.pages.update({
        page_id: params.runId,
        properties: {
          Status: { select: { name: "Review" } },
          "Completed At": { date: { start: now } },
          ...(params.endNotes
            ? {
              "Output Summary": {
                rich_text: [{ text: { content: params.endNotes } }],
              },
            }
            : {}),
        },
      } as any);

      // Get mission ID from run
      const runMissionId =
        (runPage as any).properties?.Mission?.relation?.[0]?.id;
      if (!runMissionId) {
        throw new MCPError(
          ErrorCodes.BAD_REQUEST,
          "Run has no linked mission",
          { operation: "end_run", runId: params.runId }
        );
      }

      // Get mission info
      const missions = await this.listMissions();
      const mission = missions.missions.find((m) => m.id === runMissionId);

      // Resolve actor
      const actorId = params.endedBy
        ? await this._resolveOwnerRelation(params.endedBy)
        : await this._resolveActor(params.userContext);

      // Emit RUN_ENDED timeline event
      try {
        await this.logTimelineEvent({
          title: mission?.entity
            ? `[${mission.entity}] RUN_ENDED â€” ${mission?.title || "Run"}`
            : `RUN_ENDED â€” ${mission?.title || "Run"}`,
          event_type: "RUN_ENDED",
          timestamp: now,
          entity: mission?.entity || undefined,
          room: mission?.room || undefined,
          missionId: runMissionId,
          run_id: params.runId,
          actor_people_id: actorId,
          sync_key: `RUN_ENDED_${params.runId}`,
          summary: `Run ended: ${params.endNotes || "Run completed"}`,
          external_refs: this._generateExternalRefs(
            (runPage as any).url,
            `/runs/${params.runId}`
          ),
          source: "INOS Shell",
        });
      } catch (timelineError) {
        logger.warn("Failed to log RUN_ENDED timeline event", {
          runId: params.runId,
          error: timelineError,
        });
      }

      return {
        id: runPage.id,
        url: (runPage as any).url,
        ended_at: now,
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to end run", error, { params });
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to end run", {
        operation: "end_run",
        originalError: String(error),
      });
    }
  }

  /**
   * Update AAR (After-Action Review)
   * Emits AAR_UPDATED event on first save and final save (status=Complete)
   */
  async ["aars.update"](params: {
    aarId: string;
    title?: string;
    summary?: string;
    outcomes?: string;
    lessons?: string;
    status?: string;
    updatedBy?: string;
    userContext?: { userId?: string; userHandle?: string; userName?: string };
  }) {
    try {
      const dbId = this._getMissionRunsDbId("update_aar");

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);
      await this._assertWritableDatabaseSurface(dbId, "update_aar");

      // Get current AAR to check if it's first save
      const currentAAR = await this.client.pages.retrieve({
        page_id: params.aarId,
      });
      const isFirstSave =
        !((currentAAR as any).properties?.["Output Payload / Body"]?.rich_text?.[0]?.plain_text) &&
        Boolean(params.summary || params.outcomes || params.lessons);
      const isFinalSave =
        params.status === "Complete" || params.status === "Approved";

      const properties: any = {};
      const notesSections = [
        params.title ? `AAR Title\n${params.title}` : null,
        params.summary ? `Summary\n${params.summary}` : null,
        params.outcomes ? `Outcomes\n${params.outcomes}` : null,
        params.lessons ? `Lessons\n${params.lessons}` : null,
      ].filter(Boolean);
      if (notesSections.length > 0) {
        properties["Output Payload / Body"] = {
          rich_text: [{ text: { content: notesSections.join("\n\n") } }],
        };
      }
      if (params.summary) {
        properties["Output Summary"] = {
          rich_text: [{ text: { content: params.summary } }],
        };
      }
      if (params.status) {
        properties.Status = {
          select: { name: this._mapMissionRunStatusForAAR(params.status) },
        };
      }
      if (isFinalSave) {
        const outputType = await this._resolveSelectOptionName(dbId, "Output Type", [
          "Memo",
          "JSON",
          "Other",
        ]);
        if (outputType) {
          properties["Output Type"] = { select: { name: outputType } };
        }
      }

      const aarPage = await this.client.pages.update({
        page_id: params.aarId,
        properties,
      } as any);

      // Emit AAR_UPDATED if first save or final save
      if (isFirstSave || isFinalSave) {
        try {
          const missionId = (aarPage as any).properties?.Mission?.relation?.[0]
            ?.id;
          const runId = params.aarId;

          if (missionId) {
            const missions = await this.listMissions();
            const mission = missions.missions.find((m) => m.id === missionId);

            const actorId = params.updatedBy
              ? await this._resolveOwnerRelation(params.updatedBy)
              : await this._resolveActor(params.userContext);

            await this.logTimelineEvent({
              title: mission?.entity
                ? `[${mission.entity}] AAR_UPDATED â€” ${params.title || mission?.title || "AAR"
                }`
                : `AAR_UPDATED â€” ${params.title || mission?.title || "AAR"}`,
              event_type: "AAR_UPDATED",
              timestamp: new Date().toISOString(),
              entity: mission?.entity || undefined,
              room: mission?.room || undefined,
              missionId,
              run_id: runId,
              aar_id: params.aarId,
              actor_people_id: actorId,
              sync_key: `AAR_UPDATED_${params.aarId}_${params.status}`,
              summary: isFirstSave
                ? "AAR first saved"
                : isFinalSave
                  ? "AAR completed"
                  : "AAR updated",
              external_refs: this._generateExternalRefs(
                (aarPage as any).url,
                `/aars/${params.aarId}`
              ),
              source: "INOS Shell",
            });
          }
        } catch (timelineError) {
          logger.warn("Failed to log AAR_UPDATED timeline event", {
            aarId: params.aarId,
            error: timelineError,
          });
        }
      }

      return {
        id: aarPage.id,
        url: (aarPage as any).url,
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to update AAR", error, { params });
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to update AAR", {
        operation: "update_aar",
        originalError: String(error),
      });
    }
  }

  /**
   * List runs for a mission (durable query)
   * Filters by mission_id and Run Type="Run"
   */
  async ["runs.list"](params: {
    missionId: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    runs: Array<{
      id: string;
      title: string;
      status: string;
      startDate: string | null;
      endDate: string | null;
      notes: string | null;
      url: string;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    try {
      const dbId = this._getMissionRunsDbId("list_runs_for_mission");

      const limit = Math.min(params.limit || 50, 100); // Max 100

      const query = await this.client.databases.query({
        database_id: dbId,
        filter: {
          property: "Mission",
          relation: { contains: params.missionId },
        },
        sorts: [{ property: "Started At", direction: "descending" }],
        page_size: limit + 1, // Fetch one extra to check hasMore
      });

      const hasMore = (query.results as any[]).length > limit;
      const runs = (query.results as any[]).slice(0, limit).map((page: any) => {
        const props = page.properties || {};
        const titleProp =
          props["Run ID"]?.title?.[0]?.plain_text ||
          props.Title?.title?.[0]?.plain_text ||
          props.Name?.title?.[0]?.plain_text ||
          "Untitled Run";
        const statusProp =
          props.Status?.select?.name || props.Status?.status?.name || "Unknown";
        const startDate = props["Started At"]?.date?.start || null;
        const endDate = props["Completed At"]?.date?.start || null;
        const notes =
          props["Output Summary"]?.rich_text?.[0]?.plain_text ||
          props["Failure Reason"]?.rich_text?.[0]?.plain_text ||
          props.notes?.rich_text?.[0]?.plain_text ||
          null;

        return {
          id: page.id,
          title: titleProp,
          status: statusProp,
          startDate,
          endDate,
          notes,
          url: (page as any).url || "",
        };
      });

      return {
        runs,
        total: runs.length, // Note: Notion doesn't provide total count, this is approximate
        hasMore,
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list runs for mission", error, { params });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to list runs for mission",
        {
          operation: "list_runs_for_mission",
          originalError: String(error),
        }
      );
    }
  }

  /**
   * Get AAR by Run ID (durable query)
   * Finds the paired AAR for a given Run ID
   */
  async ["aars.getByRunId"](params: { runId: string }): Promise<{
    id: string;
    title: string;
    status: string;
    summary: string | null;
    outcomes: string | null;
    lessons: string | null;
    runId: string;
    missionId: string | null;
    url: string;
  } | null> {
    try {
      const page: any = await this.client.pages.retrieve({
        page_id: params.runId,
      });
      const props = page.properties || {};
      const titleProp =
        props["Run ID"]?.title?.[0]?.plain_text ||
        props.Title?.title?.[0]?.plain_text ||
        props.Name?.title?.[0]?.plain_text ||
        "Untitled AAR";
      const statusProp =
        props.Status?.select?.name || props.Status?.status?.name || "Unknown";
      const notes =
        props["Output Payload / Body"]?.rich_text?.[0]?.plain_text ||
        props["Output Summary"]?.rich_text?.[0]?.plain_text ||
        null;
      const missionId = props.Mission?.relation?.[0]?.id || null;

      return {
        id: page.id,
        title: titleProp,
        status: statusProp,
        summary: notes,
        outcomes: null,
        lessons: null,
        runId: params.runId,
        missionId,
        url: (page as any).url || "",
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to get AAR by run ID", error, { params });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to get AAR by run ID",
        {
          operation: "get_aar_by_run_id",
          originalError: String(error),
        }
      );
    }
  }

  async queryTasksByMission(missionId: string) {
    try {
      const dbId = this._getApprovedTasksDbId("query_tasks_by_mission");

      // First, get the database schema to find the correct property name
      let missionPropertyName: string | null = null;
      try {
        const dbSchema = await this.client.databases.retrieve({
          database_id: dbId,
        });
        const properties = (dbSchema as any).properties || {};

        // Look for a relation property that might link to missions
        // Common names: "Mission", "Related Mission", "related_mission", "Related to Mission"
        const possibleNames = [
          "Mission",
          "Related Mission",
          "related_mission",
          "Related to Mission",
          "Mission Relation",
          "Parent Mission",
        ];

        for (const name of possibleNames) {
          if (properties[name] && properties[name].type === "relation") {
            missionPropertyName = name;
            break;
          }
        }

        // If not found, try to find any relation property (fallback)
        if (!missionPropertyName) {
          for (const [propName, propDef] of Object.entries(properties)) {
            if ((propDef as any).type === "relation") {
              missionPropertyName = propName;
              logger.info(
                `Using relation property '${propName}' for mission filtering (auto-detected)`
              );
              break;
            }
          }
        }
      } catch (schemaError) {
        logger.warn(
          "Failed to retrieve database schema, trying common property names",
          {
            error: String(schemaError),
          }
        );
      }

      // Try querying with the detected property name, or try common names
      const propertyNamesToTry = missionPropertyName
        ? [missionPropertyName]
        : [
          "Mission",
          "Related Mission",
          "related_mission",
          "Related to Mission",
        ];

      let res: any = null;
      let lastError: Error | null = null;

      for (const propName of propertyNamesToTry) {
        try {
          res = await this.client.databases.query({
            database_id: dbId,
            filter: {
              property: propName,
              relation: { contains: missionId },
            },
          });
          logger.info(
            `Successfully queried tasks using property '${propName}'`
          );
          break; // Success, exit loop
        } catch (error: any) {
          lastError = error;
          // If property doesn't exist, try next one
          if (
            error.message?.includes("Could not find property") ||
            error.message?.includes("property with name")
          ) {
            logger.debug(`Property '${propName}' not found, trying next...`);
            continue;
          }
          // Other errors should be thrown
          throw error;
        }
      }

      if (!res) {
        throw new MCPError(
          ErrorCodes.UPSTREAM_ERROR,
          `Could not find mission relation property in Tasks database. Tried: ${propertyNamesToTry.join(
            ", "
          )}`,
          {
            operation: "query_tasks_by_mission",
            missionId,
            triedProperties: propertyNamesToTry,
            originalError: lastError ? String(lastError) : undefined,
          }
        );
      }

      const tasks = (res.results || []).map((page: any) => {
        const props = page.properties || {};
        return {
          id: page.id,
          title:
            props["Task Title"]?.title?.[0]?.plain_text ||
            props.Name?.title?.[0]?.plain_text ||
            props.Title?.title?.[0]?.plain_text ||
            "Untitled",
          status: props.Status?.select?.name || null,
          owner: props.Owner?.people?.[0]?.name || null,
          due_date:
            props["Due Date"]?.date?.start || props.Due?.date?.start || null,
          entity:
            props.Entity?.select?.name ||
            props["Entity Registry"]?.relation?.[0]?.id ||
            null,
          room:
            props.Room?.select?.name ||
            props["Room / Primary Pod"]?.select?.name ||
            null,
          pod:
            props.Pod?.select?.name || props["Pod / HQ"]?.select?.name || null,
        };
      });
      return tasks;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to query tasks by mission", error, { missionId });
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to query tasks", {
        operation: "query_tasks_by_mission",
        originalError: String(error),
      });
    }
  }

  async ensureArkAsset(assetId: string, assetTitle?: string) {
    try {
      const dbId = this.config.NOTION_DB_ARK_ASSETS;
      if (!dbId)
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_ARK_ASSETS not configured",
          { operation: "ensure_ark_asset" }
        );
      const q = await this.client.databases.query({
        database_id: dbId,
        filter: { property: "Asset ID", rich_text: { equals: assetId } },
      });
      if (q.results && q.results.length > 0) return q.results[0];
      const created = await this.client.pages.create({
        parent: { database_id: dbId },
        properties: {
          Name: { title: [{ text: { content: assetTitle || assetId } }] },
          "Asset ID": { rich_text: [{ text: { content: assetId } }] },
        },
      } as any);
      return created;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to ensure ARK asset", error, { assetId });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to ensure ARK asset",
        { operation: "ensure_ark_asset", originalError: String(error) }
      );
    }
  }

  async logTimelineEvent(event: {
    title: string;
    type?: string;
    missionId?: string;
    link?: string;
    notes?: string;
    tags?: string[];
    source?: string;
    durationMinutes?: number;
    startedAt?: string;
    endedAt?: string;
    // Extended fields for canonical Timeline v1.0
    event_type?: string; // Canonical event type enum
    timestamp?: string; // ISO string
    entity?: string; // Legacy select
    entity_registry_id?: string; // Relation
    room?: string;
    task_id?: string;
    run_id?: string;
    aar_id?: string;
    actor_people_id?: string; // People relation
    sync_key?: string;
    summary?: string; // 1-3 lines
    external_refs?: string;
  }) {
    try {
      const dbId = this.config.NOTION_DB_TIMELINE;
      if (!dbId)
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_TIMELINE not configured",
          { operation: "log_timeline_event" }
        );

      // Guardrail: Ensure writing to canonical timeline DB
      this._validateCanonicalDb(dbId);

      logger.info("Deduplication logic starting", { dbId, sync_key: event.sync_key });

      // Deduplication: Check for existing SYNC_KEY
      if (event.sync_key) {
        const existing = await this.client.databases.query({
          database_id: dbId,
          filter: {
            property: "SYNC_KEY",
            rich_text: { equals: event.sync_key },
          },
        });

        if (existing.results.length > 0) {
          logger.info("Deduplicated: PoLE event with sync_key already exists", {
            sync_key: event.sync_key,
            pageId: existing.results[0].id,
          });
          return existing.results[0];
        }
      }

      // Use canonical timestamp or fallback to legacy fields
      const timestamp =
        event.timestamp ||
        event.startedAt ||
        event.endedAt ||
        new Date().toISOString();

      // Use canonical event_type or fallback to legacy type
      const eventType = event.event_type || event.type;

      // Auto-format title if not provided and we have event_type
      let title = event.title;
      if (!title && event.event_type && event.missionId) {
        title = `${event.event_type}`;
      }

      const timelineType = eventType && /MISSION|TASK|RUN|AAR/i.test(eventType)
        ? "Mission Event"
        : "System Change";
      const timelineEventType = eventType === "MISSION_UPDATED" ? "MISSION_UPDATED" : undefined;

      const properties: Record<string, any> = {
        // [MIND] Timeline live schema
        Name: { title: [{ text: { content: title } }] },
        Summary: title
          ? { rich_text: [{ text: { content: title } }] }
          : undefined,
        Timestamp: { date: { start: timestamp } },
        Date: { date: { start: timestamp } },
        Type: { select: { name: timelineType } },
        "Event Type": timelineEventType ? { select: { name: timelineEventType } } : undefined,
        Entity: event.entity
          ? { select: { name: event.entity } }
          : undefined,
        "SYNC_KEY": event.sync_key
          ? { rich_text: [{ text: { content: event.sync_key } }] }
          : undefined,
        Link: event.link ? { url: event.link } : undefined,
        Source: event.source
          ? { rich_text: [{ text: { content: event.source } }] }
          : { rich_text: [{ text: { content: "MCP" } }] },
        "External Refs": event.external_refs
          ? { rich_text: [{ text: { content: event.external_refs } }] }
          : undefined,
        Notes: event.notes
          ? { rich_text: [{ text: { content: event.notes } }] }
          : undefined,
        Entry: event.summary
          ? { rich_text: [{ text: { content: event.summary } }] }
          : undefined,
        Mission: event.missionId
          ? { relation: [{ id: event.missionId }] }
          : undefined,
      };

      // Filter out undefined properties
      const finalProperties = Object.keys(properties).reduce((acc: any, key) => {
        if (properties[key] !== undefined) {
          acc[key] = properties[key];
        }
        return acc;
      }, {});

      const created = await this.client.pages.create({
        parent: { database_id: dbId },
        properties: finalProperties,
      } as any);

      logger.info("PoLE event created", {
        id: created.id,
        sync_key: event.sync_key,
      });
      return created;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to log timeline event", error, { event });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to log timeline event",
        { operation: "log_timeline_event", originalError: String(error) }
      );
    }
  }

  async listTimelineEvents(filters: {
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    missionId?: string;
    limit?: number;
  }) {
    try {
      const dbId = this.config.NOTION_DB_TIMELINE;
      if (!dbId)
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_TIMELINE not configured",
          { operation: "list_timeline_events" }
        );

      const filterBlocks: any[] = [];

      // Detect property names for filtering
      let dateProp = "Timestamp"; // Canonical
      let typeProp = "Event Type"; // Canonical

      try {
        const dbSchema = await this.client.databases.retrieve({ database_id: dbId });
        const properties = (dbSchema as any).properties || {};
        if (!properties["Timestamp"] && properties["Date"]) dateProp = "Date";
        if (!properties["Event Type"] && properties["Type"]) typeProp = "Type";
      } catch (e) {
        logger.warn("Failed to detect timeline properties, using defaults", { error: String(e) });
      }

      if (filters.dateFrom || filters.dateTo) {
        filterBlocks.push({
          property: dateProp,
          date: {
            ...(filters.dateFrom ? { on_or_after: filters.dateFrom } : {}),
            ...(filters.dateTo ? { on_or_before: filters.dateTo } : {}),
          },
        });
      }
      if (filters.type) {
        filterBlocks.push({
          property: typeProp,
          select: { equals: filters.type },
        });
      }
      if (filters.missionId && filters.missionId !== "global") {
        filterBlocks.push({
          property: "Mission",
          relation: { contains: filters.missionId },
        });
      }
      const filter =
        filterBlocks.length === 0
          ? undefined
          : filterBlocks.length === 1
            ? filterBlocks[0]
            : { and: filterBlocks };

      const res = await this.client.databases.query({
        database_id: dbId,
        filter,
        sorts: [{ property: dateProp, direction: "descending" }],
        page_size: Math.min(filters.limit || 50, 100),
      });

      const events = (res.results || []).map((page: any) => {
        const props = page.properties || {};

        // Canonical mapping with fallbacks
        const type = props["Event Type"]?.select?.name || props["Type"]?.select?.name || null;
        const timestamp = props["Timestamp"]?.date?.start || props["Date"]?.date?.start || null;
        const entry = props["Summary"]?.rich_text?.[0]?.plain_text ||
          props["Notes"]?.rich_text?.[0]?.plain_text || null;
        const externalRefs = props["External Refs"]?.rich_text?.[0]?.plain_text || null;
        const actor = props["Actor"]?.people?.[0] || null;

        return {
          id: page.id,
          // [IN] Timeline uses Summary as title property
          title: props.Summary?.title?.[0]?.plain_text ||
            props.Name?.title?.[0]?.plain_text || "Untitled",
          type,
          event_type: type,
          missionId: props.Mission?.relation?.[0]?.id || null,
          tags: (props.Tags?.multi_select || []).map((tag: any) => tag.name),
          source: props.Source?.rich_text?.[0]?.plain_text || null,
          notes: props.Notes?.rich_text?.[0]?.plain_text || null,
          summary: props["Summary"]?.title?.[0]?.plain_text || entry || null,
          timestamp,
          date: timestamp,
          end_date: props.Date?.date?.end || null,
          external_refs: props["External Refs"]?.rich_text?.[0]?.plain_text || null,
          actor: actor ? { id: actor.id, name: actor.name, avatar_url: actor.avatar_url } : null,
          link: props.Link?.url || null,
          last_edited_time: page.last_edited_time,
        };
      });

      return { events };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list timeline events", error, { filters });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to list timeline events",
        { operation: "list_timeline_events", originalError: String(error) }
      );
    }
  }

  async createInboxItem(item: {
    title: string;
    source: string;
    type?: string;
    notes?: string;
  }) {
    try {
      return await this.createInboxEntry({
        item: item.title,
        source_type: item.source,
        summary: item.notes,
        object_type: item.type,
        routing_status: "new",
      });
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to create inbox item", error, { item });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to create inbox item",
        { operation: "create_inbox_item", originalError: String(error) }
      );
    }
  }

  async getInboxSchema() {
    const dbId = this.config.NOTION_DB_INBOX;
    if (!dbId) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        "NOTION_DB_INBOX not configured",
        { operation: "inbox.schema" }
      );
    }
    this._validateCanonicalDb(dbId);
    return this.client.databases.retrieve({ database_id: dbId });
  }

  private _findPropByNames(
    props: Record<string, any>,
    names: string[]
  ): { name: string; type: string } | undefined {
    const lowered = Object.keys(props).reduce<Record<string, string>>(
      (acc, key) => {
        acc[key.toLowerCase()] = key;
        return acc;
      },
      {}
    );
    for (const name of names) {
      const match = lowered[name.toLowerCase()];
      if (match && props[match]) {
        return { name: match, type: props[match].type };
      }
    }
    return undefined;
  }

  private async _getInboxPropertyMap() {
    if (this.inboxPropertyCache) return this.inboxPropertyCache;
    const dbId = this.config.NOTION_DB_INBOX;
    if (!dbId) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        "NOTION_DB_INBOX not configured",
        { operation: "inbox_property_map" }
      );
    }
    this._validateCanonicalDb(dbId);
    let schema = await this.client.databases.retrieve({ database_id: dbId });
    let props = (schema as any).properties || {};

    const ensureTextProps: Record<string, string> = {
      "Source Type Code": "source_type_code",
      "Destination DB Code": "destination_db_code",
      "Lane Code": "lane_code",
      "Layer Code": "layer_code",
      "Object Type Code": "object_type_code",
      "Domain Code": "domain_code",
      "Owner Pod Code": "owner_pod_code",
      "Routing Status Code": "routing_status_code",
      "Sensitivity Code": "sensitivity_code",
    };

    const missing: Record<string, any> = {};
    for (const [label] of Object.entries(ensureTextProps)) {
      if (!props[label]) {
        missing[label] = { rich_text: {} };
      }
    }
    if (Object.keys(missing).length > 0) {
      await this.client.databases.update({
        database_id: dbId,
        properties: missing,
      });
      schema = await this.client.databases.retrieve({ database_id: dbId });
      props = (schema as any).properties || {};
    }

    const titleProp =
      Object.entries(props).find(([, def]: any) => def.type === "title")?.[0] ||
      "Name";

    const map = {
      title: { name: titleProp, type: "title" },
      summary: this._findPropByNames(props, ["Summary", "Notes", "Description"]),
      source_type: this._findPropByNames(props, [
        "Source Type",
        "Source",
        "SourceType",
      ]),
      source_type_code: this._findPropByNames(props, ["Source Type Code"]),
      source_url: this._findPropByNames(props, [
        "Source URL",
        "Source Url",
        "URL",
        "Link",
      ]),
      source_ref: this._findPropByNames(props, ["Source Ref", "Reference", "Ref"]),
      sensitivity: this._findPropByNames(props, ["Sensitivity"]),
      sensitivity_code: this._findPropByNames(props, ["Sensitivity Code"]),
      entity_id: this._findPropByNames(props, ["Entity", "Entity ID"]),
      entity_name: this._findPropByNames(props, ["Entity Name", "Entity"]),
      room_id: this._findPropByNames(props, [
        "Room",
        "Room ID",
        "Room / Primary Pod",
      ]),
      room_name: this._findPropByNames(props, ["Room Name", "Room"]),
      routing_status: this._findPropByNames(props, [
        "Routing Status",
        "Status",
      ]),
      routing_status_code: this._findPropByNames(props, ["Routing Status Code"]),
      lane: this._findPropByNames(props, ["Lane"]),
      lane_code: this._findPropByNames(props, ["Lane Code"]),
      layer: this._findPropByNames(props, ["Layer"]),
      layer_code: this._findPropByNames(props, ["Layer Code"]),
      domain: this._findPropByNames(props, ["Domain"]),
      domain_code: this._findPropByNames(props, ["Domain Code"]),
      object_type: this._findPropByNames(props, ["Object Type", "Type"]),
      object_type_code: this._findPropByNames(props, ["Object Type Code"]),
      owner_pod: this._findPropByNames(props, ["Owner Pod", "Owner"]),
      owner_pod_code: this._findPropByNames(props, ["Owner Pod Code"]),
      destination_db: this._findPropByNames(props, [
        "Destination DB",
        "Destination",
      ]),
      destination_db_code: this._findPropByNames(props, ["Destination DB Code"]),
      routing_key: this._findPropByNames(props, ["Routing Key"]),
      target_url: this._findPropByNames(props, ["Target URL", "Target Url"]),
      target_notion_id: this._findPropByNames(props, [
        "Target Notion ID",
        "Target ID",
      ]),
      captured_at: this._findPropByNames(props, ["Captured At", "Captured"]),
      captured_by: this._findPropByNames(props, ["Captured By", "Creator"]),
      verified_at: this._findPropByNames(props, ["Verified At"]),
      verified_by: this._findPropByNames(props, ["Verified By"]),
      blocker_reason: this._findPropByNames(props, [
        "Blocker Reason",
        "Blocked Reason",
        "Block Reason",
      ]),
      duplicate_of: this._findPropByNames(props, ["Duplicate Of", "Duplicate"]),
      tags: this._findPropByNames(props, ["Tags"]),
      move_log: this._findPropByNames(props, [
        "Move Log",
        "MoveLog",
        "Audit Log",
        "Log",
      ]),
      last_move_request_id: this._findPropByNames(props, [
        "Last Move Request ID",
        "Last Move Request",
      ]),
    };

    this.inboxPropertyCache = map;
    return map;
  }

  private _setPropValue(
    prop: { name: string; type: string } | undefined,
    value: any
  ) {
    if (!prop || value === undefined || value === null || value === "") return undefined;
    switch (prop.type) {
      case "title":
        return { [prop.name]: { title: [{ text: { content: String(value) } }] } };
      case "rich_text":
        return {
          [prop.name]: { rich_text: [{ text: { content: String(value) } }] },
        };
      case "select":
        return { [prop.name]: { select: { name: String(value) } } };
      case "status":
        return { [prop.name]: { status: { name: String(value) } } };
      case "url":
        return { [prop.name]: { url: String(value) } };
      case "date":
        return { [prop.name]: { date: { start: String(value) } } };
      case "relation":
        return { [prop.name]: { relation: [{ id: String(value) }] } };
      case "multi_select":
        return {
          [prop.name]: {
            multi_select: Array.isArray(value)
              ? value.map((v) => ({ name: String(v) }))
              : [{ name: String(value) }],
          },
        };
      default:
        return {
          [prop.name]: { rich_text: [{ text: { content: String(value) } }] },
        };
    }
  }

  private _appendMoveLog(
    existing: string | null | undefined,
    entry: string
  ): string {
    const stamp = new Date().toISOString();
    const line = `[${stamp}] ${entry}`;
    if (!existing) return line;
    return `${existing}\n${line}`;
  }

  private _readPropValue(prop: any): any {
    if (!prop) return null;
    switch (prop.type) {
      case "title":
        return prop.title?.[0]?.plain_text || "";
      case "rich_text":
        return prop.rich_text?.[0]?.plain_text || "";
      case "select":
        return prop.select?.name || null;
      case "status":
        return prop.status?.name || null;
      case "url":
        return prop.url || null;
      case "date":
        return prop.date?.start || null;
      case "relation":
        return prop.relation?.[0]?.id || null;
      case "multi_select":
        return (prop.multi_select || []).map((v: any) => v.name);
      default:
        return null;
    }
  }

  async createInboxEntry(payload: {
    item: string;
    source_type?: string;
    source_type_code?: string;
    source_url?: string;
    source_ref?: string;
    captured_at?: string;
    captured_by?: string;
    summary?: string;
    sensitivity?: string;
    sensitivity_code?: string;
    entity_id?: string;
    entity_name?: string;
    room_id?: string;
    room_name?: string;
    routing_status?: string;
    routing_status_code?: string;
    lane?: string;
    lane_code?: string;
    layer?: string;
    layer_code?: string;
    domain?: string;
    domain_code?: string;
    object_type?: string;
    object_type_code?: string;
    owner_pod?: string;
    owner_pod_code?: string;
    destination_db?: string;
    destination_db_code?: string;
    routing_key?: string;
    target_url?: string;
    target_notion_id?: string;
    verified_at?: string;
    verified_by?: string;
    blocker_reason?: string;
    duplicate_of?: string;
    tags?: string[];
    move_log?: string;
    last_move_request_id?: string;
  }) {
    const dbId = this.config.NOTION_DB_INBOX;
    if (!dbId) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        "NOTION_DB_INBOX not configured",
        { operation: "inbox.create" }
      );
    }
    this._validateCanonicalDb(dbId);
    const propMap = await this._getInboxPropertyMap();
    const requiredProps = [
      propMap.title,
      propMap.source_type,
      propMap.captured_at,
      propMap.captured_by,
      propMap.summary,
      propMap.sensitivity,
      propMap.routing_status,
    ];
    if (requiredProps.some((p) => !p)) {
      throw new MCPError(
        "INBOX_E001",
        "Missing required INBOX property mappings",
        { operation: "inbox.create" }
      );
    }
    const properties: any = {};

    Object.assign(properties, this._setPropValue(propMap.title, payload.item));
    Object.assign(
      properties,
      this._setPropValue(propMap.source_type, payload.source_type)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.source_type_code, payload.source_type_code)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.source_url, payload.source_url)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.source_ref, payload.source_ref)
    );
    Object.assign(
      properties,
      this._setPropValue(
        propMap.captured_at,
        payload.captured_at || new Date().toISOString()
      )
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.captured_by, payload.captured_by)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.summary, payload.summary)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.sensitivity, payload.sensitivity)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.sensitivity_code, payload.sensitivity_code)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.entity_id, payload.entity_id)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.entity_name, payload.entity_name)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.room_id, payload.room_id)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.room_name, payload.room_name)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.routing_status, payload.routing_status)
    );
    Object.assign(
      properties,
      this._setPropValue(
        propMap.routing_status_code,
        payload.routing_status_code
      )
    );
    Object.assign(properties, this._setPropValue(propMap.lane, payload.lane));
    Object.assign(
      properties,
      this._setPropValue(propMap.lane_code, payload.lane_code)
    );
    Object.assign(properties, this._setPropValue(propMap.layer, payload.layer));
    Object.assign(
      properties,
      this._setPropValue(propMap.layer_code, payload.layer_code)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.domain, payload.domain)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.domain_code, payload.domain_code)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.object_type, payload.object_type)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.object_type_code, payload.object_type_code)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.owner_pod, payload.owner_pod)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.owner_pod_code, payload.owner_pod_code)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.destination_db, payload.destination_db)
    );
    Object.assign(
      properties,
      this._setPropValue(
        propMap.destination_db_code,
        payload.destination_db_code
      )
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.routing_key, payload.routing_key)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.target_url, payload.target_url)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.target_notion_id, payload.target_notion_id)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.verified_at, payload.verified_at)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.verified_by, payload.verified_by)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.blocker_reason, payload.blocker_reason)
    );
    Object.assign(
      properties,
      this._setPropValue(propMap.duplicate_of, payload.duplicate_of)
    );
    Object.assign(properties, this._setPropValue(propMap.tags, payload.tags));
    Object.assign(
      properties,
      this._setPropValue(propMap.move_log, payload.move_log)
    );
    Object.assign(
      properties,
      this._setPropValue(
        propMap.last_move_request_id,
        payload.last_move_request_id
      )
    );

    const created = await this.client.pages.create({
      parent: { database_id: dbId },
      properties,
    } as any);

    return created;
  }

  async updateInboxEntry(
    inboxId: string,
    patch: Record<string, any>,
    moveLogEntry?: string
  ) {
    const dbId = this.config.NOTION_DB_INBOX;
    if (!dbId) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        "NOTION_DB_INBOX not configured",
        { operation: "inbox.update" }
      );
    }
    this._validateCanonicalDb(dbId);
    const propMap = await this._getInboxPropertyMap();
    const properties: any = {};

    const fieldMap: Record<string, { name: string; type: string } | undefined> =
    {
      item: propMap.title,
      summary: propMap.summary,
      source_type: propMap.source_type,
      source_type_code: propMap.source_type_code,
      source_url: propMap.source_url,
      source_ref: propMap.source_ref,
      sensitivity: propMap.sensitivity,
      sensitivity_code: propMap.sensitivity_code,
      entity_id: propMap.entity_id,
      entity_name: propMap.entity_name,
      room_id: propMap.room_id,
      room_name: propMap.room_name,
      routing_status: propMap.routing_status,
      routing_status_code: propMap.routing_status_code,
      lane: propMap.lane,
      lane_code: propMap.lane_code,
      layer: propMap.layer,
      layer_code: propMap.layer_code,
      domain: propMap.domain,
      domain_code: propMap.domain_code,
      object_type: propMap.object_type,
      object_type_code: propMap.object_type_code,
      owner_pod: propMap.owner_pod,
      owner_pod_code: propMap.owner_pod_code,
      destination_db: propMap.destination_db,
      destination_db_code: propMap.destination_db_code,
      routing_key: propMap.routing_key,
      target_url: propMap.target_url,
      target_notion_id: propMap.target_notion_id,
      captured_at: propMap.captured_at,
      captured_by: propMap.captured_by,
      verified_at: propMap.verified_at,
      verified_by: propMap.verified_by,
      blocker_reason: propMap.blocker_reason,
      duplicate_of: propMap.duplicate_of,
      tags: propMap.tags,
      last_move_request_id: propMap.last_move_request_id,
    };

    for (const [key, val] of Object.entries(patch)) {
      if (!fieldMap[key]) continue;
      Object.assign(properties, this._setPropValue(fieldMap[key], val));
    }

    if (moveLogEntry && propMap.move_log) {
      const page = await this.client.pages.retrieve({ page_id: inboxId });
      const existing = this._readPropValue(
        (page as any).properties?.[propMap.move_log.name]
      );
      const nextLog = this._appendMoveLog(existing, moveLogEntry);
      Object.assign(properties, this._setPropValue(propMap.move_log, nextLog));
    }

    const updated = await this.client.pages.update({
      page_id: inboxId,
      properties,
    } as any);

    return updated;
  }

  async listInboxEntries(filters: {
    status?: string;
    entity_id?: string;
    room_id?: string;
    limit?: number;
    cursor?: string;
  }) {
    const dbId = this.config.NOTION_DB_INBOX;
    if (!dbId) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        "NOTION_DB_INBOX not configured",
        { operation: "inbox.list" }
      );
    }
    this._validateCanonicalDb(dbId);
    const propMap = await this._getInboxPropertyMap();

    const andFilters: any[] = [];
    if (filters.status && propMap.routing_status) {
      andFilters.push({
        property: propMap.routing_status.name,
        select: { equals: filters.status },
      });
    }
    if (filters.entity_id && propMap.entity_id) {
      andFilters.push({
        property: propMap.entity_id.name,
        select: { equals: filters.entity_id },
      });
    }
    if (filters.room_id && propMap.room_id) {
      andFilters.push({
        property: propMap.room_id.name,
        select: { equals: filters.room_id },
      });
    }

    const query: any = {
      database_id: dbId,
      page_size: filters.limit || 50,
    };
    if (filters.cursor) query.start_cursor = filters.cursor;
    if (andFilters.length === 1) query.filter = andFilters[0];
    if (andFilters.length > 1) query.filter = { and: andFilters };

    const res = await this.client.databases.query(query);
    const items = (res.results as any[]).map((page) => {
      const props = page.properties || {};
      return {
        id: page.id,
        item: this._readPropValue(props[propMap.title?.name || "Name"]),
        summary: propMap.summary
          ? this._readPropValue(props[propMap.summary.name])
          : null,
        source_type: propMap.source_type
          ? this._readPropValue(props[propMap.source_type.name])
          : null,
        source_type_code: propMap.source_type_code
          ? this._readPropValue(props[propMap.source_type_code.name])
          : null,
        source_url: propMap.source_url
          ? this._readPropValue(props[propMap.source_url.name])
          : null,
        source_ref: propMap.source_ref
          ? this._readPropValue(props[propMap.source_ref.name])
          : null,
        sensitivity: propMap.sensitivity
          ? this._readPropValue(props[propMap.sensitivity.name])
          : null,
        sensitivity_code: propMap.sensitivity_code
          ? this._readPropValue(props[propMap.sensitivity_code.name])
          : null,
        entity_id: propMap.entity_id
          ? this._readPropValue(props[propMap.entity_id.name])
          : null,
        entity_name: propMap.entity_name
          ? this._readPropValue(props[propMap.entity_name.name])
          : null,
        room_id: propMap.room_id
          ? this._readPropValue(props[propMap.room_id.name])
          : null,
        room_name: propMap.room_name
          ? this._readPropValue(props[propMap.room_name.name])
          : null,
        routing_status: propMap.routing_status
          ? this._readPropValue(props[propMap.routing_status.name])
          : null,
        routing_status_code: propMap.routing_status_code
          ? this._readPropValue(props[propMap.routing_status_code.name])
          : null,
        lane: propMap.lane ? this._readPropValue(props[propMap.lane.name]) : null,
        lane_code: propMap.lane_code
          ? this._readPropValue(props[propMap.lane_code.name])
          : null,
        layer: propMap.layer
          ? this._readPropValue(props[propMap.layer.name])
          : null,
        layer_code: propMap.layer_code
          ? this._readPropValue(props[propMap.layer_code.name])
          : null,
        domain: propMap.domain
          ? this._readPropValue(props[propMap.domain.name])
          : null,
        domain_code: propMap.domain_code
          ? this._readPropValue(props[propMap.domain_code.name])
          : null,
        object_type: propMap.object_type
          ? this._readPropValue(props[propMap.object_type.name])
          : null,
        object_type_code: propMap.object_type_code
          ? this._readPropValue(props[propMap.object_type_code.name])
          : null,
        owner_pod: propMap.owner_pod
          ? this._readPropValue(props[propMap.owner_pod.name])
          : null,
        owner_pod_code: propMap.owner_pod_code
          ? this._readPropValue(props[propMap.owner_pod_code.name])
          : null,
        destination_db: propMap.destination_db
          ? this._readPropValue(props[propMap.destination_db.name])
          : null,
        destination_db_code: propMap.destination_db_code
          ? this._readPropValue(props[propMap.destination_db_code.name])
          : null,
        routing_key: propMap.routing_key
          ? this._readPropValue(props[propMap.routing_key.name])
          : null,
        target_url: propMap.target_url
          ? this._readPropValue(props[propMap.target_url.name])
          : null,
        target_notion_id: propMap.target_notion_id
          ? this._readPropValue(props[propMap.target_notion_id.name])
          : null,
        captured_at: propMap.captured_at
          ? this._readPropValue(props[propMap.captured_at.name])
          : null,
        captured_by: propMap.captured_by
          ? this._readPropValue(props[propMap.captured_by.name])
          : null,
        verified_at: propMap.verified_at
          ? this._readPropValue(props[propMap.verified_at.name])
          : null,
        verified_by: propMap.verified_by
          ? this._readPropValue(props[propMap.verified_by.name])
          : null,
        blocker_reason: propMap.blocker_reason
          ? this._readPropValue(props[propMap.blocker_reason.name])
          : null,
        duplicate_of: propMap.duplicate_of
          ? this._readPropValue(props[propMap.duplicate_of.name])
          : null,
        tags: propMap.tags ? this._readPropValue(props[propMap.tags.name]) : [],
        move_log: propMap.move_log
          ? this._readPropValue(props[propMap.move_log.name])
          : null,
        last_move_request_id: propMap.last_move_request_id
          ? this._readPropValue(props[propMap.last_move_request_id.name])
          : null,
        url: page.url,
        last_edited_time: page.last_edited_time,
      };
    });

    return { items, next_cursor: res.next_cursor, has_more: res.has_more };
  }

  async getInboxEntry(inboxId: string) {
    const dbId = this.config.NOTION_DB_INBOX;
    if (!dbId) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        "NOTION_DB_INBOX not configured",
        { operation: "inbox.get" }
      );
    }
    this._validateCanonicalDb(dbId);
    const propMap = await this._getInboxPropertyMap();
    const page = await this.client.pages.retrieve({ page_id: inboxId });
    const props = (page as any).properties || {};
    return {
      id: page.id,
      item: this._readPropValue(props[propMap.title?.name || "Name"]),
      summary: propMap.summary
        ? this._readPropValue(props[propMap.summary.name])
        : null,
      source_type: propMap.source_type
        ? this._readPropValue(props[propMap.source_type.name])
        : null,
      source_type_code: propMap.source_type_code
        ? this._readPropValue(props[propMap.source_type_code.name])
        : null,
      source_url: propMap.source_url
        ? this._readPropValue(props[propMap.source_url.name])
        : null,
      source_ref: propMap.source_ref
        ? this._readPropValue(props[propMap.source_ref.name])
        : null,
      sensitivity: propMap.sensitivity
        ? this._readPropValue(props[propMap.sensitivity.name])
        : null,
      sensitivity_code: propMap.sensitivity_code
        ? this._readPropValue(props[propMap.sensitivity_code.name])
        : null,
      routing_status: propMap.routing_status
        ? this._readPropValue(props[propMap.routing_status.name])
        : null,
      routing_status_code: propMap.routing_status_code
        ? this._readPropValue(props[propMap.routing_status_code.name])
        : null,
      lane: propMap.lane ? this._readPropValue(props[propMap.lane.name]) : null,
      lane_code: propMap.lane_code
        ? this._readPropValue(props[propMap.lane_code.name])
        : null,
      layer: propMap.layer
        ? this._readPropValue(props[propMap.layer.name])
        : null,
      layer_code: propMap.layer_code
        ? this._readPropValue(props[propMap.layer_code.name])
        : null,
      domain: propMap.domain
        ? this._readPropValue(props[propMap.domain.name])
        : null,
      domain_code: propMap.domain_code
        ? this._readPropValue(props[propMap.domain_code.name])
        : null,
      object_type: propMap.object_type
        ? this._readPropValue(props[propMap.object_type.name])
        : null,
      object_type_code: propMap.object_type_code
        ? this._readPropValue(props[propMap.object_type_code.name])
        : null,
      owner_pod: propMap.owner_pod
        ? this._readPropValue(props[propMap.owner_pod.name])
        : null,
      owner_pod_code: propMap.owner_pod_code
        ? this._readPropValue(props[propMap.owner_pod_code.name])
        : null,
      destination_db: propMap.destination_db
        ? this._readPropValue(props[propMap.destination_db.name])
        : null,
      destination_db_code: propMap.destination_db_code
        ? this._readPropValue(props[propMap.destination_db_code.name])
        : null,
      routing_key: propMap.routing_key
        ? this._readPropValue(props[propMap.routing_key.name])
        : null,
      target_url: propMap.target_url
        ? this._readPropValue(props[propMap.target_url.name])
        : null,
      target_notion_id: propMap.target_notion_id
        ? this._readPropValue(props[propMap.target_notion_id.name])
        : null,
      verified_at: propMap.verified_at
        ? this._readPropValue(props[propMap.verified_at.name])
        : null,
      verified_by: propMap.verified_by
        ? this._readPropValue(props[propMap.verified_by.name])
        : null,
      blocker_reason: propMap.blocker_reason
        ? this._readPropValue(props[propMap.blocker_reason.name])
        : null,
      duplicate_of: propMap.duplicate_of
        ? this._readPropValue(props[propMap.duplicate_of.name])
        : null,
      tags: propMap.tags ? this._readPropValue(props[propMap.tags.name]) : [],
      move_log: propMap.move_log
        ? this._readPropValue(props[propMap.move_log.name])
        : null,
      last_move_request_id: propMap.last_move_request_id
        ? this._readPropValue(props[propMap.last_move_request_id.name])
        : null,
      url: (page as any).url,
      last_edited_time: (page as any).last_edited_time,
    };
  }

  private async _createGenericRecord(params: {
    database_id: string;
    title: string;
    summary?: string;
    source_url?: string;
  }) {
    const schema = await this.client.databases.retrieve({
      database_id: params.database_id,
    });
    const props = (schema as any).properties || {};
    const titleProp =
      Object.entries(props).find(([, def]: any) => def.type === "title")?.[0] ||
      "Name";

    const properties: any = {};
    properties[titleProp] = { title: [{ text: { content: params.title } }] };

    const summaryProp = this._findPropByNames(props, [
      "Summary",
      "Notes",
      "Description",
    ]);
    if (summaryProp && params.summary) {
      Object.assign(properties, this._setPropValue(summaryProp, params.summary));
    }

    const sourceUrlProp = this._findPropByNames(props, ["Source URL", "Link"]);
    if (sourceUrlProp && params.source_url) {
      Object.assign(
        properties,
        this._setPropValue(sourceUrlProp, params.source_url)
      );
    }

    const created = await this.client.pages.create({
      parent: { database_id: params.database_id },
      properties,
    } as any);
    return created;
  }

  async routeInboxEntry(inboxId: string, userHandle?: string) {
    const dbId = this.config.NOTION_DB_INBOX;
    if (!dbId) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        "NOTION_DB_INBOX not configured",
        { operation: "inbox.route" }
      );
    }
    this._validateCanonicalDb(dbId);
    const propMap = await this._getInboxPropertyMap();
    const page = await this.client.pages.retrieve({ page_id: inboxId });
    const props = (page as any).properties || {};

    const item = this._readPropValue(props[propMap.title?.name || "Name"]);
    const summary = propMap.summary
      ? this._readPropValue(props[propMap.summary.name])
      : null;
    const destination_db = propMap.destination_db
      ? this._readPropValue(props[propMap.destination_db.name])
      : null;
    const object_type = propMap.object_type
      ? this._readPropValue(props[propMap.object_type.name])
      : null;
    const source_url = propMap.source_url
      ? this._readPropValue(props[propMap.source_url.name])
      : null;

    if (!destination_db) {
      await this.updateInboxEntry(
        inboxId,
        {
          routing_status: "blocked",
          routing_status_code: "blocked",
          blocker_reason: "No destination_db set",
        },
        "Route blocked: missing destination_db"
      );
      return { blocked: true, reason: "No destination_db set" };
    }

    const destinationMap: Record<string, string | undefined> = {
      TIMELINE: this.config.NOTION_DB_TIMELINE,
      MISSIONS: this.config.NOTION_DB_MISSIONS,
      TASKS: this.config.NOTION_DB_TASKS,
      RUNS_AARS: this.config.NOTION_DB_RUNS_AARS,
      ARK_ASSETS: this.config.NOTION_DB_ARK_ASSETS,
      DRAFT_BLOCKS: this.config.NOTION_DB_DRAFT_BLOCKS,
      LAW_DOCS: this.config.NOTION_DB_LAW_DOCS,
      CLASS_KB: this.config.NOTION_DB_CLASS_KB,
      AGENTS: this.config.NOTION_DB_AGENTS,
    };

    const destDbId = destinationMap[destination_db];
    if (!destDbId) {
      await this.updateInboxEntry(
        inboxId,
        {
          routing_status: "blocked",
          routing_status_code: "blocked",
          blocker_reason: "Unknown destination_db",
        },
        `Route blocked: unknown destination_db (${destination_db})`
      );
      return { blocked: true, reason: "Unknown destination_db" };
    }

    let created: any = null;
    if (destination_db === "MISSIONS") {
      created = await this.upsertMissionDoc({
        title: item,
        mission_description: summary || "",
        notes: source_url ? `Inbox: ${source_url}` : undefined,
      });
    } else if (destination_db === "TASKS") {
      created = await this._createGenericRecord({
        database_id: destDbId,
        title: item,
        summary: summary || "",
        source_url: source_url || undefined,
      });
    } else {
      created = await this._createGenericRecord({
        database_id: destDbId,
        title: item,
        summary: summary || "",
        source_url: source_url || undefined,
      });
    }

    const target_id = (created as any)?.id || undefined;
    const target_url =
      (created as any)?.url || (created as any)?.data?.url || undefined;

    await this.updateInboxEntry(
      inboxId,
      {
        target_notion_id: target_id,
        target_url,
        routing_status: "routed",
        routing_status_code: "routed",
      },
      `Routed to ${destination_db} (${target_id || "unknown"})`
    );

    return { target_notion_id: target_id, target_url };
  }

  async verifyInboxEntry(inboxId: string, userHandle?: string) {
    const page = await this.client.pages.retrieve({ page_id: inboxId });
    const propMap = await this._getInboxPropertyMap();
    const props = (page as any).properties || {};
    const targetId = propMap.target_notion_id
      ? this._readPropValue(props[propMap.target_notion_id.name])
      : null;
    const targetUrl = propMap.target_url
      ? this._readPropValue(props[propMap.target_url.name])
      : null;

    if (!targetId || !targetUrl) {
      await this.updateInboxEntry(
        inboxId,
        {
          routing_status: "blocked",
          routing_status_code: "blocked",
          blocker_reason: "No target set",
        },
        "Verify blocked: no target set"
      );
      return { ok: false, reason: "No target set" };
    }

    try {
      await this.client.pages.retrieve({ page_id: String(targetId) });
      await this.updateInboxEntry(
        inboxId,
        {
          verified_at: new Date().toISOString(),
          verified_by: userHandle || "system",
          routing_status: "closed",
          routing_status_code: "closed",
        },
        `Verified and closed by ${userHandle || "system"}`
      );
      return { ok: true };
    } catch (error) {
      await this.updateInboxEntry(
        inboxId,
        {
          routing_status: "blocked",
          routing_status_code: "blocked",
          blocker_reason: "Target not found",
        },
        "Verify blocked: target not found"
      );
      return { ok: false, reason: "Target not found" };
    }
  }

  async ["missions.updateStatus"](missionId: string, status: string) {
    try {
      logger.info("Updating mission status", { missionId, status });
      const dbId = this.config.NOTION_DB_MISSIONS;
      if (!dbId) {
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_MISSIONS not configured",
          { operation: "update_mission_status" }
        );
      }

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);

      const updated = await this.client.pages.update({
        page_id: missionId,
        properties: {
          Status: { select: { name: status } },
        } as any,
      });
      return {
        id: updated.id,
        status,
        last_edited_time: (updated as any).last_edited_time,
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to update mission status", error, {
        missionId,
        status,
      });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to update mission status",
        {
          operation: "update_mission_status",
          originalError: String(error),
        }
      );
    }
  }

  async listBuildItems(filters?: {
    status?: string;
    missionId?: string;
    limit?: number;
  }) {
    try {
      const dbId =
        (this.config as any).NOTION_DB_BUILD ||
        this.config.NOTION_DB_BUILD_TASKS;
      if (!dbId)
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_BUILD not configured",
          { operation: "list_build_items" }
        );
      const filterBlocks: any[] = [];
      if (filters?.status) {
        filterBlocks.push({
          property: "Status",
          select: { equals: filters.status },
        });
      }
      if (filters?.missionId) {
        filterBlocks.push({
          property: "Mission",
          relation: { contains: filters.missionId },
        });
      }
      const filter =
        filterBlocks.length === 0
          ? undefined
          : filterBlocks.length === 1
            ? filterBlocks[0]
            : { and: filterBlocks };
      const res = await this.client.databases.query({
        database_id: dbId,
        filter,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        page_size: Math.min(filters?.limit || 50, 100),
      });
      const items = (res.results || []).map((page: any) => ({
        id: page.id,
        title: page.properties?.Name?.title?.[0]?.plain_text || "Untitled",
        status: page.properties?.Status?.select?.name || null,
        missionId: page.properties?.Mission?.relation?.[0]?.id || null,
        last_edited_time: page.last_edited_time,
      }));
      return { items };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list build items", error, { filters });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to list build items",
        {
          operation: "list_build_items",
          originalError: String(error),
        }
      );
    }
  }

  async createBuildItem(item: {
    name: string;
    missionId?: string;
    status?: string;
    notes?: string;
  }) {
    try {
      const dbId =
        (this.config as any).NOTION_DB_BUILD ||
        this.config.NOTION_DB_BUILD_TASKS;
      if (!dbId)
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_BUILD not configured",
          { operation: "create_build_item" }
        );

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);
      const properties: any = {
        Name: { title: [{ text: { content: item.name } }] },
        Status: item.status
          ? { select: { name: item.status } }
          : { select: { name: "Spec" } },
      };
      if (item.missionId) {
        properties.Mission = { relation: [{ id: item.missionId }] };
      }
      if (item.notes) {
        properties.Notes = { rich_text: [{ text: { content: item.notes } }] };
      }
      const created = await this.client.pages.create({
        parent: { database_id: dbId },
        properties,
      } as any);
      return {
        id: created.id,
        name: item.name,
        status: item.status || "Spec",
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to create build item", error, { item });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to create build item",
        { operation: "create_build_item", originalError: String(error) }
      );
    }
  }

  async updateBuildItemStatus(buildId: string, status: string) {
    try {
      logger.info("Updating build item status", { buildId, status });
      const dbId =
        (this.config as any).NOTION_DB_BUILD ||
        this.config.NOTION_DB_BUILD_TASKS;
      if (!dbId) {
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_BUILD not configured",
          { operation: "update_build_item_status" }
        );
      }

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);

      const updated = await this.client.pages.update({
        page_id: buildId,
        properties: {
          Status: { select: { name: status } },
        } as any,
      });
      return {
        id: updated.id,
        status,
        last_edited_time: (updated as any).last_edited_time,
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to update build item status", error, {
        buildId,
        status,
      });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to update build item status",
        {
          operation: "update_build_item_status",
          originalError: String(error),
        }
      );
    }
  }

  async listMissionTasks(missionId: string) {
    try {
      return await this.queryTasksByMission(missionId);
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list mission tasks", error, { missionId });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to list mission tasks",
        {
          operation: "list_mission_tasks",
          originalError: String(error),
        }
      );
    }
  }

  async getAgent(agentId: string) {
    try {
      const page = await this.client.pages.retrieve({ page_id: agentId });
      return {
        id: (page as any).id,
        name:
          (page as any).properties?.Name?.title?.[0]?.plain_text || "Untitled",
        handle:
          (page as any).properties?.Handle?.rich_text?.[0]?.plain_text || null,
        status: (page as any).properties?.Status?.select?.name || null,
        properties: (page as any).properties,
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to get agent", error, { agentId });
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to get agent", {
        operation: "get_agent",
        originalError: String(error),
      });
    }
  }

  async assignAgent(agentId: string, missionId: string, role?: string) {
    try {
      // This would typically update a relation on the mission or create an assignment record
      // For now, we'll log it to the timeline
      await this.logTimelineEvent({
        title: `Agent assigned to mission`,
        type: "agent_assignment",
        missionId,
        notes: `Agent ${agentId} assigned${role ? ` as ${role}` : ""}`,
      });
      return {
        agentId,
        missionId,
        role: role || null,
        assigned_at: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to assign agent", error, {
        agentId,
        missionId,
        role,
      });
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to assign agent", {
        operation: "assign_agent",
        originalError: String(error),
      });
    }
  }

  async listPoleEvents(filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    limit?: number;
  }) {
    try {
      // PoLE events are stored in the timeline database
      return await this.listTimelineEvents({
        dateFrom: filters?.startDate,
        dateTo: filters?.endDate,
        type: filters?.type,
        limit: filters?.limit,
      });
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list PoLE events", error, { filters });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to list PoLE events",
        {
          operation: "list_pole_events",
          originalError: String(error),
        }
      );
    }
  }

  async recordPoleEvent(event: {
    title: string;
    eventType: string;
    description: string;
    participants: string[];
    impactLevel: "critical" | "major" | "minor";
    missionId?: string;
    buildId?: string;
    tags?: string[];
  }) {
    try {
      return await this.logTimelineEvent({
        title: event.title,
        type: event.eventType,
        missionId: event.missionId,
        notes: event.description,
        tags: [
          ...(event.tags || []),
          `impact:${event.eventType}`,
          ...event.participants.map((p) => `participant:${p}`),
        ],
        source: "PoLE",
      });
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to record PoLE event", error, { event });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to record PoLE event",
        {
          operation: "record_pole_event",
          originalError: String(error),
        }
      );
    }
  }

  async listKnowledgeBaseItems(
    dbType:
      | "draft_blocks"
      | "law_docs"
      | "class_kb"
      | "bake_rnd"
      | "bob_brand"
      | "air_research",
    limit?: number
  ) {
    try {
      const dbMap: Record<string, keyof typeof this.config> = {
        draft_blocks: "NOTION_DB_DRAFT_BLOCKS",
        law_docs: "NOTION_DB_LAW_DOCS",
        class_kb: "NOTION_DB_CLASS_KB",
        bake_rnd: "NOTION_DB_BAKE_RND",
        bob_brand: "NOTION_DB_BOB_BRAND",
        air_research: "NOTION_DB_AIR_RESEARCH",
      };
      const dbKey = dbMap[dbType];
      const dbId = dbKey
        ? (this.config[dbKey] as string | undefined)
        : undefined;
      if (!dbId)
        throw new MCPError(ErrorCodes.CONFIG_ERROR, `${dbKey} not configured`, {
          operation: "list_kb_items",
          dbType,
        });
      const res = await this.client.databases.query({
        database_id: dbId,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        page_size: Math.min(limit || 50, 100),
      });
      const items = (res.results || []).map((page: any) => ({
        id: page.id,
        title:
          page.properties?.Name?.title?.[0]?.plain_text ||
          page.properties?.Title?.title?.[0]?.plain_text ||
          "Untitled",
        summary: page.properties?.Summary?.rich_text?.[0]?.plain_text || null,
        tags: (page.properties?.Tags?.multi_select || []).map(
          (tag: any) => tag.name
        ),
        last_edited_time: page.last_edited_time,
      }));
      return { items };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list knowledge base items", error, { dbType });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to list knowledge base items",
        { operation: "list_kb_items", originalError: String(error) }
      );
    }
  }

  async createKnowledgeBaseItem(
    dbType:
      | "draft_blocks"
      | "law_docs"
      | "class_kb"
      | "bake_rnd"
      | "bob_brand"
      | "air_research",
    item: {
      title: string;
      summary?: string;
      tags?: string[];
    }
  ) {
    try {
      const dbMap: Record<string, keyof typeof this.config> = {
        draft_blocks: "NOTION_DB_DRAFT_BLOCKS",
        law_docs: "NOTION_DB_LAW_DOCS",
        class_kb: "NOTION_DB_CLASS_KB",
        bake_rnd: "NOTION_DB_BAKE_RND",
        bob_brand: "NOTION_DB_BOB_BRAND",
        air_research: "NOTION_DB_AIR_RESEARCH",
      };
      const dbKey = dbMap[dbType];
      const dbId = dbKey
        ? (this.config[dbKey as keyof typeof this.config] as string | undefined)
        : undefined;
      if (!dbId)
        throw new MCPError(ErrorCodes.CONFIG_ERROR, `${dbKey} not configured`, {
          operation: "create_kb_item",
          dbType,
        });

      // Guardrail: Validate canonical DB
      this._validateCanonicalDb(dbId);
      const properties: any = {
        Name: { title: [{ text: { content: item.title } }] },
      };
      if (item.summary) {
        properties.Summary = {
          rich_text: [{ text: { content: item.summary } }],
        };
      }
      if (item.tags && item.tags.length > 0) {
        properties.Tags = {
          multi_select: item.tags.map((tag) => ({ name: tag })),
        };
      }
      const created = await this.client.pages.create({
        parent: { database_id: dbId },
        properties,
      } as any);
      return {
        id: created.id,
        title: item.title,
      };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to create knowledge base item", error, {
        dbType,
        item,
      });
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        "Failed to create knowledge base item",
        { operation: "create_kb_item", originalError: String(error) }
      );
    }
  }

  async listAgents(limit?: number) {
    try {
      const peopleDbId = this.config.NOTION_DB_TEAM_AI_PEOPLE;
      if (!peopleDbId) {
        throw new MCPError(
          ErrorCodes.CONFIG_ERROR,
          "NOTION_DB_TEAM_AI_PEOPLE not configured",
          { operation: "list_agents" }
        );
      }

      const pageSize = limit !== undefined ? Math.min(limit, 100) : 100;
      const res = await this.client.databases.query({
        database_id: peopleDbId,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        page_size: pageSize,
      });

      const agents = (res.results || []).map((page: any) => {
        const props = page.properties || {};
        const name =
          props.Name?.title?.[0]?.plain_text ||
          props.Title?.title?.[0]?.plain_text ||
          "Untitled";
        const handle =
          props.Handle?.rich_text?.[0]?.plain_text ||
          props.Handle?.rich_text?.[0]?.text?.content ||
          null;
        const status = props.Status?.select?.name || null;
        const pod =
          props.Pod?.select?.name || props["Pod / HQ"]?.select?.name || null;

        return {
          id: page.id,
          name,
          handle,
          status,
          pod,
        };
      });

      return { agents };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list agents", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list agents", {
        operation: "list_agents",
        originalError: String(error),
      });
    }
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // INOS Epoch 0 â€” Canonical Database Methods
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * [IN] Identity â€” list rows.
   * Filters: identity_type, handle, status, entity, limit
   */
  async listIdentities(filters: any = {}) {
    try {
      logger.info("Starting listIdentities", { filters });
      const dbId = (this.config as any).NOTION_IDENTITY_DB_ID || this.config.NOTION_DB_AGENTS || this.config.NOTION_DB_ENTITIES;
      if (!dbId) {
        throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_IDENTITY_DB_ID not configured", { operation: "list_identities" });
      }

      const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 50;
      const andFilters: any[] = [];

      if (filters.identity_type) {
        andFilters.push({ property: "Identity Type", select: { equals: filters.identity_type } });
      }
      if (filters.handle) {
        andFilters.push({ property: "Handle / Code", rich_text: { equals: filters.handle } });
      }
      if (filters.status) {
        andFilters.push({ property: "Status", select: { equals: filters.status } });
      }
      if (filters.entity) {
        andFilters.push({ property: "Entity", multi_select: { contains: filters.entity } });
      }

      const queryParams: any = { database_id: dbId, page_size: limit, sorts: [{ property: "Name", direction: "ascending" }] };
      if (andFilters.length > 0) queryParams.filter = andFilters.length === 1 ? andFilters[0] : { and: andFilters };

      const result = await this.client.databases.query(queryParams);
      const identities = result.results.map((page: any) => {
        const p = page.properties || {};
        return {
          id: page.id,
          name: p["Name"]?.title?.[0]?.plain_text || "Untitled",
          identity_type: p["Identity Type"]?.select?.name || null,
          handle: p["Handle / Code"]?.rich_text?.[0]?.plain_text || null,
          status: p["Status"]?.select?.name || null,
          entity: (p["Entity"]?.multi_select || []).map((e: any) => e.name),
          pod_layer: p["Pod / Layer"]?.select?.name || null,
          anchor_entity: p["Anchor Entity"]?.select?.name || null,
          role_description: p["Role / Description"]?.rich_text?.[0]?.plain_text || null,
          profile_link: p["Profile Link"]?.url || null,
          notion_url: page.url,
          last_edited_time: page.last_edited_time,
        };
      });

      return { identities, total: identities.length };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list identities", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list identities", { operation: "list_identities", originalError: String(error) });
    }
  }

  /**
   * [ARK] Specs â€” list rows.
   * Filters: status, pod_owner, entity, limit
   */
  async listSpecs(filters: any = {}) {
    try {
      logger.info("Starting listSpecs", { filters });
      const dbId = (this.config as any).NOTION_SPECS_DB_ID;
      if (!dbId) {
        throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_SPECS_DB_ID not configured", { operation: "list_specs" });
      }

      const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 50;
      const andFilters: any[] = [];

      if (filters.status) andFilters.push({ property: "Status", select: { equals: filters.status } });
      if (filters.pod_owner) andFilters.push({ property: "Pod Owner", select: { equals: filters.pod_owner } });
      if (filters.entity) andFilters.push({ property: "Entity", multi_select: { contains: filters.entity } });

      const queryParams: any = { database_id: dbId, page_size: limit, sorts: [{ property: "Version", direction: "descending" }] };
      if (andFilters.length > 0) queryParams.filter = andFilters.length === 1 ? andFilters[0] : { and: andFilters };

      const result = await this.client.databases.query(queryParams);
      const specs = result.results.map((page: any) => {
        const p = page.properties || {};
        return {
          id: page.id,
          spec_title: p["Spec Title"]?.title?.[0]?.plain_text || "Untitled",
          version: p["Version"]?.rich_text?.[0]?.plain_text || null,
          status: p["Status"]?.select?.name || null,
          pod_owner: p["Pod Owner"]?.select?.name || null,
          entity: (p["Entity"]?.multi_select || []).map((e: any) => e.name),
          sync_key: p["SYNC_KEY"]?.rich_text?.[0]?.plain_text || null,
          doc_link: p["Doc Link"]?.url || null,
          notion_url: page.url,
          last_edited_time: page.last_edited_time,
        };
      });

      return { specs, total: specs.length };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list specs", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list specs", { operation: "list_specs", originalError: String(error) });
    }
  }

  /**
   * [ARK] Specs â€” create a new spec row.
   */
  async createSpec(data: {
    spec_title: string;
    version: string;
    status?: string;
    pod_owner?: string;
    entity?: string[];
    sync_key?: string;
    doc_link?: string;
    acceptance_tests?: string;
  }) {
    try {
      const dbId = (this.config as any).NOTION_SPECS_DB_ID;
      if (!dbId) throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_SPECS_DB_ID not configured", { operation: "create_spec" });
      this._validateCanonicalDb(dbId);

      const properties: any = {
        "Spec Title": { title: [{ text: { content: data.spec_title } }] },
        "Version": { rich_text: [{ text: { content: data.version } }] },
      };
      if (data.status) properties["Status"] = { select: { name: data.status } };
      if (data.pod_owner) properties["Pod Owner"] = { select: { name: data.pod_owner } };
      if (data.entity?.length) properties["Entity"] = { multi_select: data.entity.map((e) => ({ name: e })) };
      if (data.sync_key) properties["SYNC_KEY"] = { rich_text: [{ text: { content: data.sync_key } }] };
      if (data.doc_link) properties["Doc Link"] = { url: data.doc_link };
      if (data.acceptance_tests) properties["Acceptance Tests"] = { rich_text: [{ text: { content: data.acceptance_tests } }] };

      const page = await this.client.pages.create({ parent: { database_id: dbId }, properties } as any);
      return { id: (page as any).id, notion_url: (page as any).url, created_time: (page as any).created_time };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to create spec", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to create spec", { operation: "create_spec", originalError: String(error) });
    }
  }

  /**
   * [ARK] Canon Registry â€” list active canon entries.
   */
  async listCanonRegistry(filters: any = {}) {
    try {
      logger.info("Starting listCanonRegistry", { filters });
      const dbId = (this.config as any).NOTION_CANON_REGISTRY_DB_ID || this.config.NOTION_DB_ARK_REGISTRY;
      if (!dbId) throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_CANON_REGISTRY_DB_ID not configured", { operation: "list_canon_registry" });

      const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 50;
      const andFilters: any[] = [];

      if (filters.status) andFilters.push({ property: "Status", select: { equals: filters.status } });
      if (filters.entity) andFilters.push({ property: "Entity", multi_select: { contains: filters.entity } });

      const queryParams: any = { database_id: dbId, page_size: limit, sorts: [{ property: "Effective From", direction: "descending" }] };
      if (andFilters.length > 0) queryParams.filter = andFilters.length === 1 ? andFilters[0] : { and: andFilters };

      const result = await this.client.databases.query(queryParams);
      const entries = result.results.map((page: any) => {
        const p = page.properties || {};
        return {
          id: page.id,
          scope_title: p["Scope Title"]?.title?.[0]?.plain_text || "Untitled",
          scope_code: p["Scope Code"]?.rich_text?.[0]?.plain_text || null,
          status: p["Status"]?.select?.name || null,
          entity: (p["Entity"]?.multi_select || []).map((e: any) => e.name),
          effective_from: p["Effective From"]?.date?.start || null,
          effective_to: p["Effective To"]?.date?.start || null,
          notion_url: page.url,
        };
      });

      return { canon_entries: entries, total: entries.length };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list canon registry", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list canon registry", { operation: "list_canon_registry", originalError: String(error) });
    }
  }

  /**
   * [LAW] Policies â€” list rows.
   */
  async listPolicies(filters: any = {}) {
    try {
      logger.info("Starting listPolicies", { filters });
      const dbId = (this.config as any).NOTION_POLICIES_DB_ID || this.config.NOTION_DB_LAW_DOCS;
      if (!dbId) throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_POLICIES_DB_ID not configured", { operation: "list_policies" });

      const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 50;
      const andFilters: any[] = [];

      if (filters.status) andFilters.push({ property: "Status", select: { equals: filters.status } });
      if (filters.scope) andFilters.push({ property: "Scope", select: { equals: filters.scope } });
      if (filters.type) andFilters.push({ property: "Type", select: { equals: filters.type } });

      const queryParams: any = { database_id: dbId, page_size: limit, sorts: [{ property: "Policy Title", direction: "ascending" }] };
      if (andFilters.length > 0) queryParams.filter = andFilters.length === 1 ? andFilters[0] : { and: andFilters };

      const result = await this.client.databases.query(queryParams);
      const policies = result.results.map((page: any) => {
        const p = page.properties || {};
        return {
          id: page.id,
          policy_title: p["Policy Title"]?.title?.[0]?.plain_text || "Untitled",
          status: p["Status"]?.select?.name || null,
          scope: p["Scope"]?.select?.name || null,
          type: p["Type"]?.select?.name || null,
          effective_from: p["Effective From"]?.date?.start || null,
          notion_url: page.url,
          last_edited_time: page.last_edited_time,
        };
      });

      return { policies, total: policies.length };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list policies", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list policies", { operation: "list_policies", originalError: String(error) });
    }
  }

  /**
   * [LAW] Policies â€” create a new policy row.
   */
  async createPolicy(data: {
    policy_title: string;
    description?: string;
    scope?: string;
    type?: string;
    status?: string;
    effective_from?: string;
  }) {
    try {
      const dbId = (this.config as any).NOTION_POLICIES_DB_ID || this.config.NOTION_DB_LAW_DOCS;
      if (!dbId) throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_POLICIES_DB_ID not configured", { operation: "create_policy" });
      this._validateCanonicalDb(dbId);

      const properties: any = { "Policy Title": { title: [{ text: { content: data.policy_title } }] } };
      if (data.description) properties["Description"] = { rich_text: [{ text: { content: data.description } }] };
      if (data.scope) properties["Scope"] = { select: { name: data.scope } };
      if (data.type) properties["Type"] = { select: { name: data.type } };
      if (data.status) properties["Status"] = { select: { name: data.status } };
      if (data.effective_from) properties["Effective From"] = { date: { start: data.effective_from } };

      const page = await this.client.pages.create({ parent: { database_id: dbId }, properties } as any);
      return { id: (page as any).id, notion_url: (page as any).url, created_time: (page as any).created_time };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to create policy", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to create policy", { operation: "create_policy", originalError: String(error) });
    }
  }

  /**
   * [LAW] Approvals & Decisions â€” list rows.
   */
  async listApprovals(filters: any = {}) {
    try {
      logger.info("Starting listApprovals", { filters });
      const dbId = (this.config as any).NOTION_APPROVALS_DB_ID;
      if (!dbId) throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_APPROVALS_DB_ID not configured", { operation: "list_approvals" });

      const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 50;
      const andFilters: any[] = [];

      if (filters.decision_type) andFilters.push({ property: "Decision Type", select: { equals: filters.decision_type } });
      if (filters.status) andFilters.push({ property: "Status", select: { equals: filters.status } });
      if (filters.entity) andFilters.push({ property: "Entity", multi_select: { contains: filters.entity } });

      const queryParams: any = { database_id: dbId, page_size: limit, sorts: [{ property: "Decision Date", direction: "descending" }] };
      if (andFilters.length > 0) queryParams.filter = andFilters.length === 1 ? andFilters[0] : { and: andFilters };

      const result = await this.client.databases.query(queryParams);
      const approvals = result.results.map((page: any) => {
        const p = page.properties || {};
        return {
          id: page.id,
          decision_title: p["Decision Title"]?.title?.[0]?.plain_text || "Untitled",
          decision_type: p["Decision Type"]?.select?.name || null,
          target_type: p["Target Type"]?.select?.name || null,
          status: p["Status"]?.select?.name || null,
          decision_date: p["Decision Date"]?.date?.start || null,
          entity: (p["Entity"]?.multi_select || []).map((e: any) => e.name),
          notion_url: page.url,
        };
      });

      return { approvals, total: approvals.length };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list approvals", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list approvals", { operation: "list_approvals", originalError: String(error) });
    }
  }

  /**
   * [LAW] Approvals & Decisions â€” create a decision record.
   */
  async createApproval(data: {
    decision_title: string;
    decision_type: string;
    target_type?: string;
    reason: string;
    conditions?: string;
    decision_date: string;
    entity?: string[];
    status?: string;
  }) {
    try {
      const dbId = (this.config as any).NOTION_APPROVALS_DB_ID;
      if (!dbId) throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_APPROVALS_DB_ID not configured", { operation: "create_approval" });
      this._validateCanonicalDb(dbId);

      const properties: any = {
        "Decision Title": { title: [{ text: { content: data.decision_title } }] },
        "Decision Type": { select: { name: data.decision_type } },
        "Reason": { rich_text: [{ text: { content: data.reason } }] },
        "Decision Date": { date: { start: data.decision_date } },
      };
      if (data.target_type) properties["Target Type"] = { select: { name: data.target_type } };
      if (data.conditions) properties["Conditions"] = { rich_text: [{ text: { content: data.conditions } }] };
      if (data.entity?.length) properties["Entity"] = { multi_select: data.entity.map((e) => ({ name: e })) };
      if (data.status) properties["Status"] = { select: { name: data.status } };

      const page = await this.client.pages.create({ parent: { database_id: dbId }, properties } as any);
      return { id: (page as any).id, notion_url: (page as any).url, created_time: (page as any).created_time };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to create approval", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to create approval", { operation: "create_approval", originalError: String(error) });
    }
  }

  /**
   * [MIND] Artifact Index â€” list rows.
   */
  async listArtifactIndex(filters: any = {}) {
    try {
      logger.info("Starting listArtifactIndex", { filters });
      const dbId = (this.config as any).NOTION_ARTIFACT_INDEX_DB_ID;
      if (!dbId) throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_ARTIFACT_INDEX_DB_ID not configured", { operation: "list_artifact_index" });

      const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 50;
      const andFilters: any[] = [];

      if (filters.artifact_type) andFilters.push({ property: "Artifact Type", select: { equals: filters.artifact_type } });
      if (filters.entity) andFilters.push({ property: "Entity", multi_select: { contains: filters.entity } });
      if (filters.status) andFilters.push({ property: "Status", select: { equals: filters.status } });

      const queryParams: any = { database_id: dbId, page_size: limit, sorts: [{ property: "Timestamp", direction: "descending" }] };
      if (andFilters.length > 0) queryParams.filter = andFilters.length === 1 ? andFilters[0] : { and: andFilters };

      const result = await this.client.databases.query(queryParams);
      const artifacts = result.results.map((page: any) => {
        const p = page.properties || {};
        return {
          id: page.id,
          artifact_title: p["Artifact Title"]?.title?.[0]?.plain_text || "Untitled",
          artifact_type: p["Artifact Type"]?.select?.name || null,
          entity: (p["Entity"]?.multi_select || []).map((e: any) => e.name),
          pod: p["Pod"]?.select?.name || null,
          timestamp: p["Timestamp"]?.date?.start || null,
          source_id: p["Source ID"]?.rich_text?.[0]?.plain_text || null,
          location: p["Location"]?.url || null,
          summary: p["Summary"]?.rich_text?.[0]?.plain_text || null,
          status: p["Status"]?.select?.name || null,
          notion_url: page.url,
        };
      });

      return { artifacts, total: artifacts.length };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list artifact index", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list artifact index", { operation: "list_artifact_index", originalError: String(error) });
    }
  }

  /**
   * [MIND] Artifact Index â€” create an artifact entry.
   */
  async createArtifactEntry(data: {
    artifact_title: string;
    artifact_type: string;
    entity?: string[];
    pod?: string;
    timestamp?: string;
    source_id?: string;
    location?: string;
    summary?: string;
    tags?: string[];
  }) {
    try {
      const dbId = (this.config as any).NOTION_ARTIFACT_INDEX_DB_ID;
      if (!dbId) throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_ARTIFACT_INDEX_DB_ID not configured", { operation: "create_artifact_entry" });
      this._validateCanonicalDb(dbId);

      const properties: any = {
        "Artifact Title": { title: [{ text: { content: data.artifact_title } }] },
        "Artifact Type": { select: { name: data.artifact_type } },
      };
      if (data.entity?.length) properties["Entity"] = { multi_select: data.entity.map((e) => ({ name: e })) };
      if (data.pod) properties["Pod"] = { select: { name: data.pod } };
      if (data.timestamp) properties["Timestamp"] = { date: { start: data.timestamp } };
      if (data.source_id) properties["Source ID"] = { rich_text: [{ text: { content: data.source_id } }] };
      if (data.location) properties["Location"] = { url: data.location };
      if (data.summary) properties["Summary"] = { rich_text: [{ text: { content: data.summary } }] };
      if (data.tags?.length) properties["Tags"] = { multi_select: data.tags.map((t) => ({ name: t })) };

      const page = await this.client.pages.create({ parent: { database_id: dbId }, properties } as any);
      return { id: (page as any).id, notion_url: (page as any).url, created_time: (page as any).created_time };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to create artifact entry", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to create artifact entry", { operation: "create_artifact_entry", originalError: String(error) });
    }
  }

  /**
   * [IN] Knowledge Articles â€” list rows.
   */
  async listKnowledgeArticles(filters: any = {}) {
    try {
      logger.info("Starting listKnowledgeArticles", { filters });
      const dbId = (this.config as any).NOTION_KNOWLEDGE_ARTICLES_DB_ID || this.config.NOTION_DB_CLASS_KB;
      if (!dbId) throw new MCPError(ErrorCodes.CONFIG_ERROR, "NOTION_KNOWLEDGE_ARTICLES_DB_ID not configured", { operation: "list_knowledge_articles" });

      const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 50;
      const andFilters: any[] = [];

      if (filters.status) andFilters.push({ property: "Status", select: { equals: filters.status } });
      if (filters.article_type) andFilters.push({ property: "Article Type", select: { equals: filters.article_type } });
      if (filters.entity) andFilters.push({ property: "Entity", multi_select: { contains: filters.entity } });
      if (filters.pod_owner) andFilters.push({ property: "Pod Owner", select: { equals: filters.pod_owner } });

      const queryParams: any = { database_id: dbId, page_size: limit, sorts: [{ property: "Article Title", direction: "ascending" }] };
      if (andFilters.length > 0) queryParams.filter = andFilters.length === 1 ? andFilters[0] : { and: andFilters };

      const result = await this.client.databases.query(queryParams);
      const articles = result.results.map((page: any) => {
        const p = page.properties || {};
        return {
          id: page.id,
          article_title: p["Article Title"]?.title?.[0]?.plain_text || "Untitled",
          article_type: p["Article Type"]?.select?.name || null,
          status: p["Status"]?.select?.name || null,
          entity: (p["Entity"]?.multi_select || []).map((e: any) => e.name),
          pod_owner: p["Pod Owner"]?.select?.name || null,
          version: p["Version"]?.rich_text?.[0]?.plain_text || null,
          doc_link: p["Doc Link"]?.url || null,
          tags: (p["Tags"]?.multi_select || []).map((t: any) => t.name),
          review_date: p["Review Date"]?.date?.start || null,
          notion_url: page.url,
          last_edited_time: page.last_edited_time,
        };
      });

      return { articles, total: articles.length };
    } catch (error) {
      if (error instanceof MCPError) throw error;
      logger.error("Failed to list knowledge articles", error);
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, "Failed to list knowledge articles", { operation: "list_knowledge_articles", originalError: String(error) });
    }
  }

  private _getMissionRunsDbId(operation: string) {
    const dbId =
      (this.config as any).NOTION_MISSION_RUNS_DB_ID ||
      this.config.NOTION_DB_RUNS_AARS;
    if (!dbId) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        "Mission Runs database not configured",
        { operation }
      );
    }
    return dbId;
  }

  private async _resolveSelectOptionName(
    dbId: string,
    propertyName: string,
    candidates: string[]
  ): Promise<string | null> {
    try {
      const dbSchema = await this.client.databases.retrieve({ database_id: dbId });
      const property = (dbSchema as any).properties?.[propertyName];
      const optionNames = Array.isArray(property?.select?.options)
        ? property.select.options.map((option: any) => String(option.name))
        : Array.isArray(property?.status?.options)
          ? property.status.options.map((option: any) => String(option.name))
          : Array.isArray(property?.options)
            ? property.options.map((option: any) => String(option.name))
            : [];

      for (const candidate of candidates) {
        if (optionNames.includes(candidate)) return candidate;
      }
      return optionNames[0] || null;
    } catch (error) {
      logger.warn("Failed to resolve select option from schema", {
        dbId,
        propertyName,
        error: String(error),
      });
      return null;
    }
  }

  private _mapMissionRunStatusForAAR(status: string) {
    switch (status) {
      case "Draft":
      case "Proposed":
      case "Queued":
        return "Queued";
      case "In Progress":
      case "Review":
        return "Review";
      case "Complete":
      case "Approved":
        return "Approved";
      case "Needs Follow-up":
      case "Failed":
        return "Failed";
      case "Archived":
        return "Archived";
      case "Cancelled":
        return "Cancelled";
      default:
        return "Review";
    }
  }

  /**
   * Guardrail: Validates that a database ID belongs to the canonical set.
   * Explicitly rejects writes to non-canonical databases.
   */
  private _validateCanonicalDb(dbId: string) {
    const canonicalDbs = [
      // INOS Epoch 0 â€” Ten Canonical DBs
      (this.config as any).NOTION_IDENTITY_DB_ID,
      (this.config as any).NOTION_TIMELINE_DB_ID,
      (this.config as any).NOTION_MISSIONS_DB_ID,
      (this.config as any).NOTION_MISSION_RUNS_DB_ID,
      (this.config as any).NOTION_AAR_DB_ID,
      (this.config as any).NOTION_SPECS_DB_ID,
      (this.config as any).NOTION_CANON_REGISTRY_DB_ID,
      (this.config as any).NOTION_POLICIES_DB_ID,
      (this.config as any).NOTION_APPROVALS_DB_ID,
      (this.config as any).NOTION_ARTIFACT_INDEX_DB_ID,
      (this.config as any).NOTION_KNOWLEDGE_ARTICLES_DB_ID,
      (this.config as any).NOTION_FOOD_INGREDIENTS_DB_ID,
      // Legacy DBs (still valid write targets during migration)
      this.config.NOTION_DB_MISSIONS,
      this.config.NOTION_DB_TIMELINE,
      this.config.NOTION_DB_RUNS_AARS,
      this.config.NOTION_DB_INBOX,
      this.config.NOTION_DB_TEAM_AI_PEOPLE,
      this.config.NOTION_DB_POLE_EVENTS,
      this.config.NOTION_DB_BAKE_RND,
      this.config.NOTION_DB_BOB_BRAND,
      this.config.NOTION_DB_AIR_RESEARCH,
      this.config.NOTION_DB_DRAFT_BLOCKS,
      this.config.NOTION_DB_LAW_DOCS,
      this.config.NOTION_DB_CLASS_KB,
    ].filter(Boolean);

    if (!canonicalDbs.includes(dbId)) {
      throw new MCPError(
        ErrorCodes.BAD_REQUEST,
        `Access Denied: Database ${dbId} is not a registered canonical surface.`,
        { operation: "guardrail.db_validation", dbId }
      );
    }
  }

  /**
   * Guardrail: validates that a write-target database is still writable.
   * This prevents runtime writes to trashed databases or databases parented
   * under trashed legacy pages even when the env pointer still resolves.
   */
  private async _assertWritableDatabaseSurface(
    dbId: string,
    operation: string
  ) {
    let dbSchema: any;
    try {
      dbSchema = await this.client.databases.retrieve({ database_id: dbId });
    } catch (error) {
      throw new MCPError(
        ErrorCodes.UPSTREAM_ERROR,
        `Failed to verify database surface for ${operation}`,
        { operation, dbId, originalError: String(error) }
      );
    }

    if ((dbSchema as any).in_trash || (dbSchema as any).archived) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        `Write blocked: database ${dbId} is archived or in trash.`,
        {
          operation,
          dbId,
          databaseTitle:
            (dbSchema as any).title?.[0]?.plain_text ||
            (dbSchema as any).title?.[0]?.text?.content ||
            null,
          archived: Boolean((dbSchema as any).archived),
          in_trash: Boolean((dbSchema as any).in_trash),
        }
      );
    }

    const parent = (dbSchema as any).parent;
    if (parent?.type === "page_id" && parent.page_id) {
      try {
        const parentPage: any = await this.client.pages.retrieve({
          page_id: parent.page_id,
        });
        if (parentPage?.in_trash || parentPage?.archived) {
          throw new MCPError(
            ErrorCodes.CONFIG_ERROR,
            `Write blocked: database ${dbId} is parented under an archived or trashed page.`,
            {
              operation,
              dbId,
              parentPageId: parent.page_id,
              parentArchived: Boolean(parentPage?.archived),
              parentInTrash: Boolean(parentPage?.in_trash),
            }
          );
        }
      } catch (error) {
        if (error instanceof MCPError) throw error;
        throw new MCPError(
          ErrorCodes.UPSTREAM_ERROR,
          `Failed to verify database parent surface for ${operation}`,
          { operation, dbId, parentPageId: parent.page_id, originalError: String(error) }
        );
      }
    }
  }

  /**
   * Resolve the approved Tasks surface for this remediation wave.
   * Tasks may use the explicit TASKS ids only; do not silently fall through
   * to BUILD task surfaces while the legacy-parent exception is being managed.
   */
  private _getApprovedTasksDbId(operation: string) {
    const dbId =
      this.config.NOTION_DB_TASKS || (this.config as any).NOTION_TASKS_DB_ID;
    if (!dbId) {
      throw new MCPError(
        ErrorCodes.CONFIG_ERROR,
        "NOTION_DB_TASKS not configured. BUILD_TASKS/BUILD fallback is disabled during TASKS remediation.",
        { operation }
      );
    }
    return dbId;
  }

  async ["missions.tasks.list"](missionId: string) {
    return this.listMissionTasks(missionId);
  }
}

