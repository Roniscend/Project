"""
Grid Fault Management System — Backend
FastAPI server exposing all DAA + OS algorithms
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import time
import random
import threading
from collections import deque
import math

app = FastAPI(title="Grid Fault Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
#  POWER GRID  (25 substations + 3 depots)
# ─────────────────────────────────────────────
NODES = {
    # Repair depots
    "D1": {"label": "Depot North",   "type": "depot",    "x": 150, "y": 80,  "critical": False},
    "D2": {"label": "Depot Central", "type": "depot",    "x": 500, "y": 300, "critical": False},
    "D3": {"label": "Depot South",   "type": "depot",    "x": 800, "y": 520, "critical": False},
    # Critical nodes
    "S1": {"label": "City Hospital",      "type": "critical", "x": 300, "y": 130, "critical": True},
    "S2": {"label": "Water Treatment",    "type": "critical", "x": 650, "y": 110, "critical": True},
    "S3": {"label": "Emergency Services", "type": "critical", "x": 420, "y": 200, "critical": True},
    # Standard substations
    "S4":  {"label": "Zone A-North",   "type": "substation", "x": 200,  "y": 200,  "critical": False},
    "S5":  {"label": "Zone A-East",    "type": "substation", "x": 380,  "y": 150,  "critical": False},
    "S6":  {"label": "Zone B-West",    "type": "substation", "x": 100,  "y": 310,  "critical": False},
    "S7":  {"label": "Zone B-Central", "type": "substation", "x": 280,  "y": 290,  "critical": False},
    "S8":  {"label": "Zone B-East",    "type": "substation", "x": 460,  "y": 270,  "critical": False},
    "S9":  {"label": "Zone C-North",   "type": "substation", "x": 570,  "y": 180,  "critical": False},
    "S10": {"label": "Zone C-East",    "type": "substation", "x": 710,  "y": 220,  "critical": False},
    "S11": {"label": "Zone C-South",   "type": "substation", "x": 590,  "y": 320,  "critical": False},
    "S12": {"label": "Zone D-West",    "type": "substation", "x": 160,  "y": 420,  "critical": False},
    "S13": {"label": "Zone D-Central", "type": "substation", "x": 340,  "y": 400,  "critical": False},
    "S14": {"label": "Zone D-East",    "type": "substation", "x": 510,  "y": 390,  "critical": False},
    "S15": {"label": "Zone E-North",   "type": "substation", "x": 670,  "y": 380,  "critical": False},
    "S16": {"label": "Zone E-South",   "type": "substation", "x": 740,  "y": 460,  "critical": False},
    "S17": {"label": "Zone F-West",    "type": "substation", "x": 240,  "y": 510,  "critical": False},
    "S18": {"label": "Zone F-Central", "type": "substation", "x": 430,  "y": 490,  "critical": False},
    "S19": {"label": "Zone F-East",    "type": "substation", "x": 620,  "y": 500,  "critical": False},
    "S20": {"label": "Zone G-South",   "type": "substation", "x": 350,  "y": 580,  "critical": False},
    "S21": {"label": "Zone G-East",    "type": "substation", "x": 540,  "y": 570,  "critical": False},
    "S22": {"label": "Zone H-Far",     "type": "substation", "x": 850,  "y": 320,  "critical": False},
    "S23": {"label": "Zone H-South",   "type": "substation", "x": 880,  "y": 420,  "critical": False},
    "S24": {"label": "Zone I-Outer",   "type": "substation", "x": 100,  "y": 570,  "critical": False},
    "S25": {"label": "Industrial Hub", "type": "substation", "x": 730,  "y": 560,  "critical": False},
}

# Adjacency list with edge weights (distance in km)
EDGES = [
    ("D1", "S4",  12), ("D1", "S1",  8),  ("D1", "S5",  15),
    ("D1", "S6",  20), ("D2", "S8",  6),  ("D2", "S7",  9),
    ("D2", "S11", 10), ("D2", "S13", 12), ("D2", "S14", 8),
    ("D3", "S19", 7),  ("D3", "S16", 9),  ("D3", "S25", 11),
    ("S1", "S4",  10), ("S1", "S3",  9),  ("S1", "S5",  12),
    ("S2", "S9",  8),  ("S2", "S10", 7),  ("S2", "S5",  14),
    ("S3", "S8",  11), ("S3", "S5",  7),  ("S3", "S9",  13),
    ("S4", "S6",  15), ("S4", "S7",  12), ("S5", "S8",  10),
    ("S5", "S9",  11), ("S6", "S7",  14), ("S6", "S12", 16),
    ("S7", "S8",  9),  ("S7", "S13", 14), ("S8", "S11", 8),
    ("S8", "S14", 12), ("S9", "S10", 9),  ("S9", "S11", 10),
    ("S10","S11", 11), ("S10","S15", 13), ("S10","S22", 15),
    ("S11","S14", 9),  ("S11","S15", 12), ("S12","S13", 16),
    ("S12","S17", 13), ("S12","S24", 18), ("S13","S14", 11),
    ("S13","S17", 14), ("S13","S18", 12), ("S14","S15", 10),
    ("S14","S18", 11), ("S15","S16", 9),  ("S15","S19", 14),
    ("S16","S19", 10), ("S16","S23", 12), ("S16","S25", 13),
    ("S17","S18", 14), ("S17","S20", 12), ("S17","S24", 16),
    ("S18","S19", 13), ("S18","S20", 11), ("S18","S21", 10),
    ("S19","S21", 9),  ("S19","S25", 11), ("S20","S21", 12),
    ("S20","S24", 17), ("S21","S25", 10), ("S22","S23", 13),
    ("S22","S10", 15), ("S23","S25", 14),
]

def build_adjacency():
    adj = {n: [] for n in NODES}
    for u, v, w in EDGES:
        adj[u].append((v, w))
        adj[v].append((u, w))
    return adj

ADJ = build_adjacency()

# ─────────────────────────────────────────────
#  ALGORITHM HELPERS
# ─────────────────────────────────────────────

def bfs_shortest_path(start: str, target: str):
    """BFS – unweighted shortest path (fewest hops)."""
    if start == target:
        return [start], 0, 0

    visited = {start: None}
    queue = deque([start])
    steps = 0
    nodes_visited = []

    while queue:
        current = queue.popleft()
        nodes_visited.append(current)
        steps += 1
        for neighbor, _ in ADJ[current]:
            if neighbor not in visited:
                visited[neighbor] = current
                if neighbor == target:
                    # reconstruct
                    path = []
                    node = target
                    while node is not None:
                        path.append(node)
                        node = visited[node]
                    path.reverse()
                    return path, len(path) - 1, steps
                queue.append(neighbor)
    return [], -1, steps  # unreachable


def dfs_affected_zones(fault_node: str, blockers: list[str] = None):
    """DFS – find all nodes reachable from fault_node."""
    blockers = set(blockers or [])
    visited_order = []
    visited_set = set()

    def dfs(node):
        visited_set.add(node)
        visited_order.append(node)
        for neighbor, _ in ADJ[node]:
            if neighbor not in visited_set and neighbor not in blockers:
                dfs(neighbor)

    import sys
    sys.setrecursionlimit(500)
    dfs(fault_node)
    return visited_order


def brute_force_path(start: str, target: str, max_depth: int = 12):
    """Brute-force all paths; return shortest by hop count."""
    best = {"path": None, "hops": float("inf")}
    visited = set()
    paths_explored = [0]

    def dfs(node, path):
        if len(path) > max_depth:
            return
        if node == target:
            paths_explored[0] += 1
            if len(path) - 1 < best["hops"]:
                best["path"] = list(path)
                best["hops"] = len(path) - 1
            return
        for neighbor, _ in ADJ[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                path.append(neighbor)
                dfs(neighbor, path)
                path.pop()
                visited.remove(neighbor)

    visited.add(start)
    dfs(start, [start])
    return best["path"] or [], best["hops"], paths_explored[0]


def nearest_depot(fault_node: str):
    """BFS from each depot; return depot with fewest hops to fault."""
    depots = [n for n, d in NODES.items() if d["type"] == "depot"]
    best_depot = None
    best_path = None
    best_hops = float("inf")
    for depot in depots:
        path, hops, _ = bfs_shortest_path(depot, fault_node)
        if hops != -1 and hops < best_hops:
            best_hops = hops
            best_path = path
            best_depot = depot
    return best_depot, best_path, best_hops


# ─────────────────────────────────────────────
#  ROUND-ROBIN SCHEDULER
# ─────────────────────────────────────────────

class RRScheduler:
    """Round-Robin crew dispatch across multiple faults."""

    def __init__(self, faults: list[dict], time_quantum: int = 3):
        self.faults = faults        # [{id, node, burst_time, priority, critical}]
        self.quantum = time_quantum

    def simulate(self):
        queue = list(self.faults)
        # Sort critical nodes first (priority-based bonus)
        queue.sort(key=lambda f: (0 if f.get("critical") else 1, f["arrival"]))

        current_time = 0
        remaining = {f["id"]: f["burst"] for f in queue}
        gantt = []
        waiting = {f["id"]: 0 for f in queue}
        completion = {}
        rr_queue = deque()
        arrived_set = set()
        fault_map = {f["id"]: f for f in queue}
        pending = sorted(queue, key=lambda f: f["arrival"])
        pending_idx = 0

        # seed initial arrivals
        while pending_idx < len(pending) and pending[pending_idx]["arrival"] <= current_time:
            rr_queue.append(pending[pending_idx]["id"])
            arrived_set.add(pending[pending_idx]["id"])
            pending_idx += 1

        iterations = 0
        while rr_queue and iterations < 500:
            iterations += 1
            fid = rr_queue.popleft()
            f = fault_map[fid]
            exec_time = min(self.quantum, remaining[fid])
            start = current_time
            current_time += exec_time
            remaining[fid] -= exec_time

            gantt.append({
                "fault_id": fid,
                "fault_label": f["node"],
                "crew": f.get("crew", "Crew-Auto"),
                "start": start,
                "end": current_time,
                "critical": f.get("critical", False),
            })

            # admit newly arrived
            while pending_idx < len(pending) and pending[pending_idx]["arrival"] <= current_time:
                pid = pending[pending_idx]["id"]
                if pid not in arrived_set:
                    rr_queue.append(pid)
                    arrived_set.add(pid)
                pending_idx += 1

            if remaining[fid] > 0:
                rr_queue.append(fid)
            else:
                completion[fid] = current_time
                tat = current_time - f["arrival"]
                waiting[fid] = tat - f["burst"]

        results = []
        for f in queue:
            fid = f["id"]
            tat = completion.get(fid, current_time) - f["arrival"]
            results.append({
                "fault_id": fid,
                "node": f["node"],
                "crew": f.get("crew", "Crew-Auto"),
                "burst": f["burst"],
                "arrival": f["arrival"],
                "completion": completion.get(fid, current_time),
                "turnaround": tat,
                "waiting": max(0, tat - f["burst"]),
                "critical": f.get("critical", False),
            })

        return gantt, results


# ─────────────────────────────────────────────
#  REQUEST / RESPONSE MODELS
# ─────────────────────────────────────────────

class BFSRequest(BaseModel):
    depot: Optional[str] = None   # if None → auto-detect nearest
    fault: str
    use_brute_force: bool = False

class DFSRequest(BaseModel):
    fault: str
    blockers: Optional[list[str]] = []

class FaultItem(BaseModel):
    id: str
    node: str
    burst: int            # repair time in minutes
    arrival: int = 0      # arrival time
    crew: str = "Crew-A"
    critical: bool = False

class SchedulerRequest(BaseModel):
    faults: list[FaultItem]
    time_quantum: int = 3

class MultiDemoRequest(BaseModel):
    time_quantum: int = 3

# ─────────────────────────────────────────────
#  ENDPOINTS
# ─────────────────────────────────────────────

@app.get("/api/graph")
def get_graph():
    """Return full graph topology."""
    return {
        "nodes": NODES,
        "edges": [{"from": u, "to": v, "weight": w} for u, v, w in EDGES],
    }


@app.post("/api/bfs")
def run_bfs(req: BFSRequest):
    t0 = time.perf_counter()

    depot = req.depot
    if not depot:
        depot, auto_path, auto_hops = nearest_depot(req.fault)
        bfs_path = auto_path
        hops = auto_hops
        _, steps = bfs_path, auto_hops
        # recount steps
        bfs_path, hops, steps = bfs_shortest_path(depot, req.fault)
    else:
        bfs_path, hops, steps = bfs_shortest_path(depot, req.fault)

    bfs_time = (time.perf_counter() - t0) * 1000

    result = {
        "algorithm": "BFS",
        "depot": depot,
        "fault": req.fault,
        "path": bfs_path,
        "hops": hops,
        "nodes_explored": steps,
        "time_ms": round(bfs_time, 4),
        "brute_force": None,
    }

    if req.use_brute_force:
        t1 = time.perf_counter()
        bf_path, bf_hops, bf_paths = brute_force_path(depot, req.fault)
        bf_time = (time.perf_counter() - t1) * 1000
        result["brute_force"] = {
            "path": bf_path,
            "hops": bf_hops,
            "paths_explored": bf_paths,
            "time_ms": round(bf_time, 4),
        }

    return result


@app.post("/api/dfs")
def run_dfs(req: DFSRequest):
    t0 = time.perf_counter()
    visited_order = dfs_affected_zones(req.fault, req.blockers)
    dfs_time = (time.perf_counter() - t0) * 1000
    return {
        "algorithm": "DFS",
        "fault": req.fault,
        "affected_zones": visited_order,
        "zone_count": len(visited_order),
        "time_ms": round(dfs_time, 4),
    }


@app.post("/api/schedule")
def run_scheduler(req: SchedulerRequest):
    faults_dicts = [f.model_dump() for f in req.faults]
    for f in faults_dicts:
        f["critical"] = NODES.get(f["node"], {}).get("critical", False)
    scheduler = RRScheduler(faults_dicts, req.time_quantum)
    gantt, results = scheduler.simulate()
    avg_wait = sum(r["waiting"] for r in results) / len(results) if results else 0
    avg_tat  = sum(r["turnaround"] for r in results) / len(results) if results else 0
    return {
        "gantt": gantt,
        "results": results,
        "avg_waiting_time": round(avg_wait, 2),
        "avg_turnaround_time": round(avg_tat, 2),
        "time_quantum": req.time_quantum,
    }


@app.post("/api/demo")
def run_full_demo(req: MultiDemoRequest):
    """
    Demo: 3 simultaneous faults — runs BFS, DFS, and Round-Robin all at once.
    Fault nodes picked to show critical-node priority.
    """
    demo_faults = [
        {"id": "F1", "node": "S1",  "burst": 8,  "arrival": 0, "crew": "Crew-Alpha",   "critical": True},
        {"id": "F2", "node": "S14", "burst": 5,  "arrival": 1, "crew": "Crew-Bravo",   "critical": False},
        {"id": "F3", "node": "S22", "burst": 10, "arrival": 2, "crew": "Crew-Charlie",  "critical": False},
    ]

    bfs_results = []
    dfs_results = []
    for fault in demo_faults:
        depot, path, hops = nearest_depot(fault["node"])
        _, _, steps = bfs_shortest_path(depot, fault["node"])
        dfs_zones = dfs_affected_zones(fault["node"])
        bfs_results.append({
            "fault_id": fault["id"],
            "fault_node": fault["node"],
            "depot": depot,
            "path": path,
            "hops": hops,
        })
        dfs_results.append({
            "fault_id": fault["id"],
            "fault_node": fault["node"],
            "affected_count": len(dfs_zones),
            "affected_zones": dfs_zones,
        })

    scheduler = RRScheduler(demo_faults, req.time_quantum)
    gantt, sched_results = scheduler.simulate()
    avg_wait = sum(r["waiting"] for r in sched_results) / len(sched_results)

    return {
        "demo_faults": demo_faults,
        "bfs_results": bfs_results,
        "dfs_results": dfs_results,
        "gantt": gantt,
        "schedule_results": sched_results,
        "avg_waiting_time": round(avg_wait, 2),
        "time_quantum": req.time_quantum,
    }


@app.get("/api/nodes")
def get_nodes():
    return NODES


@app.get("/")
def root():
    return {"status": "Grid Fault Management API running", "docs": "/docs"}
