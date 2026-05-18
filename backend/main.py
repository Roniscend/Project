"""
Grid Fault Management System — Backend
Real Bangalore power grid topology using actual lat/lng coordinates.
Edges auto-generated via Haversine distance (nodes within threshold connected).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time
import math
from collections import deque

app = FastAPI(title="Grid Fault Management API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─────────────────────────────────────────────────────────────
#  REAL BANGALORE POWER GRID NODES  (lat/lng from OpenStreetMap)
# ─────────────────────────────────────────────────────────────
NODES = {
    # ── Depots (BESCOM/KPTCL main stations) ──
    "D1": {"label": "BESCOM Rajajinagar depot",      "type": "depot",      "lat": 12.9942, "lng": 77.5521, "critical": False, "area": "Rajajinagar"},
    "D2": {"label": "KPTCL Indiranagar depot",       "type": "depot",      "lat": 12.9784, "lng": 77.6408, "critical": False, "area": "Indiranagar"},
    "D3": {"label": "BESCOM Electronic City depot",  "type": "depot",      "lat": 12.8399, "lng": 77.6770, "critical": False, "area": "Electronic City"},

    # ── Critical infrastructure ──
    "S1":  {"label": "Bowring Hospital Substation",  "type": "critical",   "lat": 12.9676, "lng": 77.6040, "critical": True,  "area": "Shivajinagar"},
    "S2":  {"label": "Hebbal Water Treatment",       "type": "critical",   "lat": 13.0352, "lng": 77.5990, "critical": True,  "area": "Hebbal"},
    "S3":  {"label": "Fire Services HQ – MG Road",  "type": "critical",   "lat": 12.9750, "lng": 77.6016, "critical": True,  "area": "MG Road"},

    # ── Substations (real Bangalore areas) ──
    "S4":  {"label": "Majestic Substation",          "type": "substation", "lat": 12.9773, "lng": 77.5713, "critical": False, "area": "Majestic"},
    "S5":  {"label": "Koramangala 5-Block Sub.",     "type": "substation", "lat": 12.9352, "lng": 77.6245, "critical": False, "area": "Koramangala"},
    "S6":  {"label": "Jayanagar 4-Block Sub.",       "type": "substation", "lat": 12.9250, "lng": 77.5938, "critical": False, "area": "Jayanagar"},
    "S7":  {"label": "BTM Layout Substation",        "type": "substation", "lat": 12.9166, "lng": 77.6101, "critical": False, "area": "BTM Layout"},
    "S8":  {"label": "HSR Layout Substation",        "type": "substation", "lat": 12.9116, "lng": 77.6389, "critical": False, "area": "HSR Layout"},
    "S9":  {"label": "Whitefield Substation",        "type": "substation", "lat": 12.9698, "lng": 77.7499, "critical": False, "area": "Whitefield"},
    "S10": {"label": "Marathahalli Substation",      "type": "substation", "lat": 12.9591, "lng": 77.7005, "critical": False, "area": "Marathahalli"},
    "S11": {"label": "Bellandur Substation",         "type": "substation", "lat": 12.9253, "lng": 77.6759, "critical": False, "area": "Bellandur"},
    "S12": {"label": "Kengeri Substation",           "type": "substation", "lat": 12.9060, "lng": 77.4823, "critical": False, "area": "Kengeri"},
    "S13": {"label": "Banashankari Substation",      "type": "substation", "lat": 12.9253, "lng": 77.5456, "critical": False, "area": "Banashankari"},
    "S14": {"label": "JP Nagar Substation",          "type": "substation", "lat": 12.9102, "lng": 77.5857, "critical": False, "area": "JP Nagar"},
    "S15": {"label": "Silk Board Substation",        "type": "substation", "lat": 12.9171, "lng": 77.6223, "critical": False, "area": "Silk Board"},
    "S16": {"label": "Bommanahalli Substation",      "type": "substation", "lat": 12.8924, "lng": 77.6395, "critical": False, "area": "Bommanahalli"},
    "S17": {"label": "Vijayanagar Substation",       "type": "substation", "lat": 12.9709, "lng": 77.5253, "critical": False, "area": "Vijayanagar"},
    "S18": {"label": "Yeshwanthpur Substation",      "type": "substation", "lat": 13.0235, "lng": 77.5389, "critical": False, "area": "Yeshwanthpur"},
    "S19": {"label": "Yelahanka Substation",         "type": "substation", "lat": 13.1007, "lng": 77.5963, "critical": False, "area": "Yelahanka"},
    "S20": {"label": "KR Puram Substation",          "type": "substation", "lat": 13.0073, "lng": 77.6941, "critical": False, "area": "KR Puram"},
    "S21": {"label": "Banaswadi Substation",         "type": "substation", "lat": 13.0117, "lng": 77.6542, "critical": False, "area": "Banaswadi"},
    "S22": {"label": "Domlur Substation",            "type": "substation", "lat": 12.9606, "lng": 77.6380, "critical": False, "area": "Domlur"},
    "S23": {"label": "Nagarbhavi Substation",        "type": "substation", "lat": 12.9682, "lng": 77.5048, "critical": False, "area": "Nagarbhavi"},
    "S24": {"label": "RR Nagar Substation",          "type": "substation", "lat": 12.9237, "lng": 77.5221, "critical": False, "area": "RR Nagar"},
    "S25": {"label": "Sarjapur Road Substation",     "type": "substation", "lat": 12.8688, "lng": 77.7085, "critical": False, "area": "Sarjapur"},
    "S26": {"label": "Hennur Substation",            "type": "substation", "lat": 13.0393, "lng": 77.6409, "critical": False, "area": "Hennur"},
    "S27": {"label": "RT Nagar Substation",          "type": "substation", "lat": 13.0207, "lng": 77.5926, "critical": False, "area": "RT Nagar"},
    "S28": {"label": "Malleshwaram Substation",      "type": "substation", "lat": 13.0035, "lng": 77.5681, "critical": False, "area": "Malleshwaram"},
}

# ─────────────────────────────────────────────────────────────
#  AUTO-BUILD EDGES via Haversine distance
#  Nodes within EDGE_THRESHOLD_KM are connected.
# ─────────────────────────────────────────────────────────────
EDGE_THRESHOLD_KM = 8.5

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi   = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return round(2 * R * math.asin(math.sqrt(a)), 2)

def build_edges():
    ids = list(NODES.keys())
    edges = []
    seen = set()
    for i, u in enumerate(ids):
        for j, v in enumerate(ids):
            if i >= j:
                continue
            dist = haversine(
                NODES[u]["lat"], NODES[u]["lng"],
                NODES[v]["lat"], NODES[v]["lng"]
            )
            if dist <= EDGE_THRESHOLD_KM:
                key = (min(u, v), max(u, v))
                if key not in seen:
                    seen.add(key)
                    edges.append((u, v, dist))
    return edges

EDGES = build_edges()

def build_adjacency():
    adj = {n: [] for n in NODES}
    for u, v, w in EDGES:
        adj[u].append((v, w))
        adj[v].append((u, w))
    return adj

ADJ = build_adjacency()

# ─────────────────────────────────────────────────────────────
#  CUSTOM GRAPH HELPERS
# ─────────────────────────────────────────────────────────────

def build_custom_adj(nodes_dict: dict, edges_list: list) -> dict:
    """Build adjacency list from arbitrary user-supplied nodes + edges."""
    adj = {n: [] for n in nodes_dict}
    for e in (edges_list or []):
        u, v = e.get('from', ''), e.get('to', '')
        w = float(e.get('weight', 1.0))
        if u in adj and v in adj:
            adj[u].append((v, w))
            adj[v].append((u, w))
    return adj

def bfs_on_adj(start: str, target: str, adj: dict):
    """BFS on an arbitrary adjacency list."""
    if start == target:
        return [start], 0, 0
    visited = {start: None}
    queue = deque([start])
    steps = 0
    while queue:
        current = queue.popleft()
        steps += 1
        for neighbor, _ in adj.get(current, []):
            if neighbor not in visited:
                visited[neighbor] = current
                if neighbor == target:
                    path, node = [], target
                    while node is not None:
                        path.append(node)
                        node = visited[node]
                    path.reverse()
                    return path, len(path) - 1, steps
                queue.append(neighbor)
    return [], -1, steps

def dfs_on_adj(fault_node: str, adj: dict, blockers: list = None):
    """DFS on an arbitrary adjacency list."""
    blockers = set(blockers or [])
    visited_order, visited_set = [], set()
    import sys; sys.setrecursionlimit(5000)
    def dfs(node):
        visited_set.add(node)
        visited_order.append(node)
        for neighbor, _ in adj.get(node, []):
            if neighbor not in visited_set and neighbor not in blockers:
                dfs(neighbor)
    dfs(fault_node)
    return visited_order

def nearest_depot_custom(fault_node: str, nodes_dict: dict, adj: dict):
    """Find nearest depot in a custom graph via BFS."""
    depots = [n for n, d in nodes_dict.items() if d.get('type') == 'depot']
    best_depot, best_path, best_hops = None, None, float('inf')
    for depot in depots:
        path, hops, _ = bfs_on_adj(depot, fault_node, adj)
        if hops != -1 and hops < best_hops:
            best_hops = hops; best_path = path; best_depot = depot
    return best_depot, best_path, best_hops

# ─────────────────────────────────────────────────────────────
#  ALGORITHMS
# ─────────────────────────────────────────────────────────────

def bfs_shortest_path(start: str, target: str):
    if start == target:
        return [start], 0, 0
    visited = {start: None}
    queue = deque([start])
    steps = 0
    while queue:
        current = queue.popleft()
        steps += 1
        for neighbor, _ in ADJ[current]:
            if neighbor not in visited:
                visited[neighbor] = current
                if neighbor == target:
                    path, node = [], target
                    while node is not None:
                        path.append(node)
                        node = visited[node]
                    path.reverse()
                    return path, len(path) - 1, steps
                queue.append(neighbor)
    return [], -1, steps


def dfs_affected_zones(fault_node: str, blockers: list = None):
    blockers = set(blockers or [])
    visited_order, visited_set = [], set()
    def dfs(node):
        visited_set.add(node)
        visited_order.append(node)
        for neighbor, _ in ADJ[node]:
            if neighbor not in visited_set and neighbor not in blockers:
                dfs(neighbor)
    import sys; sys.setrecursionlimit(1000)
    dfs(fault_node)
    return visited_order


def brute_force_path(start: str, target: str, max_depth: int = 10, adj: dict = None):
    """Brute-force explores all paths and returns a RANDOM one (not shortest).
    This demonstrates that brute force is inefficient and non-optimal."""
    import random
    adj = adj if adj is not None else ADJ
    all_paths = []
    paths_explored = [0]
    visited = set()
    def dfs(node, path):
        if len(path) > max_depth + 1: return
        if node == target:
            paths_explored[0] += 1
            all_paths.append(list(path))
            return
        # Randomize neighbor order so each call explores differently
        neighbors = list(adj.get(node, []))
        random.shuffle(neighbors)
        for neighbor, _ in neighbors:
            if neighbor not in visited:
                visited.add(neighbor)
                path.append(neighbor)
                dfs(neighbor, path)
                path.pop()
                visited.remove(neighbor)
    visited.add(start)
    dfs(start, [start])
    if not all_paths:
        return [], -1, paths_explored[0]
    # Pick a RANDOM path (intentionally not the shortest) to show brute force is non-optimal
    random.shuffle(all_paths)
    chosen = all_paths[0]
    return chosen, len(chosen) - 1, paths_explored[0]


def nearest_depot(fault_node: str):
    depots = [n for n, d in NODES.items() if d["type"] == "depot"]
    best_depot, best_path, best_hops = None, None, float("inf")
    for depot in depots:
        path, hops, _ = bfs_shortest_path(depot, fault_node)
        if hops != -1 and hops < best_hops:
            best_hops = hops; best_path = path; best_depot = depot
    return best_depot, best_path, best_hops


# ─────────────────────────────────────────────────────────────
#  ROUND-ROBIN SCHEDULER
# ─────────────────────────────────────────────────────────────

def run_round_robin(faults: list, time_quantum: int):
    """Priority Round-Robin: very_critical > critical > standard.
    Higher-priority faults are always inserted ahead of lower-priority ones."""

    def priority_key(f):
        p = f.get("priority", "standard")
        if p == "very_critical": return 0
        if p == "critical" or f.get("critical"): return 1
        return 2

    fault_map  = {f["id"]: f for f in faults}
    remaining  = {f["id"]: f["burst"] for f in faults}
    pending    = sorted(faults, key=lambda f: f["arrival"])
    pending_idx, arrived_set = 0, set()
    rr_queue   = deque()
    gantt, completion = [], {}
    current_time = 0

    def insert_by_priority(q, fid):
        """Insert fid into deque before the first item of strictly lower priority."""
        pk = priority_key(fault_map[fid])
        tmp = list(q)
        pos = len(tmp)
        for i, qid in enumerate(tmp):
            if priority_key(fault_map[qid]) > pk:
                pos = i
                break
        tmp.insert(pos, fid)
        return deque(tmp)

    # Seed queue with faults that arrive at t=0
    while pending_idx < len(pending) and pending[pending_idx]["arrival"] <= current_time:
        fid = pending[pending_idx]["id"]
        arrived_set.add(fid)
        rr_queue = insert_by_priority(rr_queue, fid)
        pending_idx += 1

    iterations = 0
    while rr_queue and iterations < 500:
        iterations += 1
        fid = rr_queue.popleft()
        f   = fault_map[fid]
        exec_time    = min(time_quantum, remaining[fid])
        start        = current_time
        current_time += exec_time
        remaining[fid] -= exec_time
        gantt.append({
            "fault_id":    fid,
            "fault_label": f["node"],
            "crew":        f.get("crew", "Crew"),
            "start":       start,
            "end":         current_time,
            "critical":    f.get("critical", False),
            "priority":    f.get("priority", "standard"),
        })

        # Enqueue any faults that arrived during this slice
        while pending_idx < len(pending) and pending[pending_idx]["arrival"] <= current_time:
            pid = pending[pending_idx]["id"]
            if pid not in arrived_set:
                arrived_set.add(pid)
                rr_queue = insert_by_priority(rr_queue, pid)
            pending_idx += 1

        # Re-queue current fault if not finished, respecting priority
        if remaining[fid] > 0:
            rr_queue = insert_by_priority(rr_queue, fid)
        else:
            completion[fid] = current_time

    results = []
    for f in faults:
        fid = f["id"]
        tat = completion.get(fid, current_time) - f["arrival"]
        results.append({
            "fault_id":   fid,
            "node":       f["node"],
            "crew":       f.get("crew", "Crew"),
            "burst":      f["burst"],
            "arrival":    f["arrival"],
            "completion": completion.get(fid, current_time),
            "turnaround": tat,
            "waiting":    max(0, tat - f["burst"]),
            "critical":   f.get("critical", False),
            "priority":   f.get("priority", "standard"),
        })
    return gantt, results


# ─────────────────────────────────────────────────────────────
#  MODELS
# ─────────────────────────────────────────────────────────────

class BFSRequest(BaseModel):
    depot: Optional[str] = None        # None → auto-detect nearest depot
    fault: Optional[str] = None        # target node
    use_brute_force: bool = False
    # custom user-built graph (optional)
    custom_nodes: Optional[dict] = None
    custom_edges: Optional[list] = None
    # legacy aliases
    start:  Optional[str] = None
    target: Optional[str] = None

class DFSRequest(BaseModel):
    fault: str
    blockers: Optional[list[str]] = []
    # custom user-built graph (optional)
    custom_nodes: Optional[dict] = None
    custom_edges: Optional[list] = None

class FaultItem(BaseModel):
    id: str
    node: str
    burst: int
    arrival: int = 0
    crew: str = "Crew-A"
    critical: bool = False
    priority: str = "standard"   # "standard" | "critical" | "very_critical"

class SchedulerRequest(BaseModel):
    faults: list[FaultItem]
    time_quantum: int = 3

class DemoRequest(BaseModel):
    time_quantum: int = 3

# ─────────────────────────────────────────────────────────────
#  ENDPOINTS
# ─────────────────────────────────────────────────────────────

@app.get("/api/graph")
def get_graph():
    return {
        "nodes": NODES,
        "edges": [{"from": u, "to": v, "weight": w} for u, v, w in EDGES],
    }

@app.get("/api/nodes")
def get_nodes():
    return NODES

@app.post("/api/bfs")
def run_bfs(req: BFSRequest):
    fault_node = req.fault or req.target or ""
    depot_node = req.depot or req.start
    use_custom = bool(req.custom_nodes and len(req.custom_nodes) > 0)

    if use_custom:
        # ── Custom user-built graph ──────────────────────────
        nodes_data = req.custom_nodes
        edges_data = req.custom_edges or []
        custom_adj = build_custom_adj(nodes_data, edges_data)

        if not fault_node or fault_node not in nodes_data:
            return {"error": f"Fault node '{fault_node}' not in custom graph"}

        t0 = time.perf_counter()
        if depot_node and depot_node in nodes_data:
            chosen_depot = depot_node
            path, hops, steps = bfs_on_adj(depot_node, fault_node, custom_adj)
        else:
            chosen_depot, path, hops = nearest_depot_custom(fault_node, nodes_data, custom_adj)
            steps = hops if hops != -1 else 0
        bfs_ms = round((time.perf_counter() - t0) * 1000, 4)

        if not chosen_depot:
            return {"error": "No depot node found in custom graph. Add a Depot node first."}

        total_km = 0
        for i in range(len(path) - 1):
            n1, n2 = nodes_data[path[i]], nodes_data[path[i+1]]
            total_km += haversine(n1["lat"], n1["lng"], n2["lat"], n2["lng"])

        result = {
            "algorithm": "BFS", "depot": chosen_depot, "start": chosen_depot,
            "fault": fault_node, "target": fault_node, "path": path,
            "hops": hops, "nodes_explored": steps,
            "total_km": round(total_km, 2), "time_ms": bfs_ms, "brute_force": None,
            "depot_label": nodes_data.get(chosen_depot, {}).get("label", chosen_depot),
            "fault_label": nodes_data.get(fault_node, {}).get("label", fault_node),
        }

        if req.use_brute_force:
            t1 = time.perf_counter()
            bf_path, bf_hops, bf_paths = brute_force_path(chosen_depot, fault_node, adj=custom_adj)
            bf_ms = round((time.perf_counter() - t1) * 1000, 4)
            result["brute_force"] = {"path": bf_path, "hops": bf_hops,
                                      "paths_explored": bf_paths, "time_ms": bf_ms}
        return result

    # ── Bangalore hardcoded graph ────────────────────────────
    if not fault_node or fault_node not in NODES:
        return {"error": f"Unknown fault node: '{fault_node}'"}

    t0 = time.perf_counter()
    if depot_node and depot_node in NODES:
        chosen_depot = depot_node
        path, hops, steps = bfs_shortest_path(depot_node, fault_node)
    else:
        chosen_depot, path, hops = nearest_depot(fault_node)
        steps = hops if hops != -1 else 0
    bfs_ms = round((time.perf_counter() - t0) * 1000, 4)

    total_km = sum(
        haversine(NODES[path[i]]["lat"], NODES[path[i]]["lng"],
                  NODES[path[i+1]]["lat"], NODES[path[i+1]]["lng"])
        for i in range(len(path) - 1)
    )
    result = {
        "algorithm": "BFS", "depot": chosen_depot, "start": chosen_depot,
        "fault": fault_node, "target": fault_node, "path": path,
        "hops": hops, "nodes_explored": steps,
        "total_km": round(total_km, 2), "time_ms": bfs_ms, "brute_force": None,
        "depot_label": NODES.get(chosen_depot, {}).get("label", ""),
        "fault_label": NODES.get(fault_node, {}).get("label", ""),
    }
    if req.use_brute_force:
        t1 = time.perf_counter()
        bf_path, bf_hops, bf_paths = brute_force_path(chosen_depot, fault_node)
        bf_ms = round((time.perf_counter() - t1) * 1000, 4)
        result["brute_force"] = {"path": bf_path, "hops": bf_hops,
                                  "paths_explored": bf_paths, "time_ms": bf_ms}
    return result

@app.post("/api/dfs")
def run_dfs(req: DFSRequest):
    use_custom = bool(req.custom_nodes and len(req.custom_nodes) > 0)
    t0 = time.perf_counter()

    if use_custom:
        nodes_data = req.custom_nodes
        edges_data = req.custom_edges or []
        custom_adj = build_custom_adj(nodes_data, edges_data)
        if req.fault not in nodes_data:
            return {"error": f"Fault node '{req.fault}' not in custom graph"}
        zones = dfs_on_adj(req.fault, custom_adj, req.blockers)
    else:
        zones = dfs_affected_zones(req.fault, req.blockers)

    return {
        "algorithm": "DFS", "fault": req.fault,
        "affected_zones": zones, "zone_count": len(zones),
        "time_ms": round((time.perf_counter() - t0) * 1000, 4),
    }

@app.post("/api/schedule")
def run_schedule(req: SchedulerRequest):
    faults = [f.model_dump() for f in req.faults]
    for f in faults:
        # Derive critical flag from priority field first, then fallback to node lookup
        if f.get("priority") in ("critical", "very_critical"):
            f["critical"] = True
        elif not f.get("critical"):
            f["critical"] = NODES.get(f["node"], {}).get("critical", False)
    gantt, results = run_round_robin(faults, req.time_quantum)
    avg_wait = sum(r["waiting"] for r in results) / len(results) if results else 0
    avg_tat  = sum(r["turnaround"] for r in results) / len(results) if results else 0
    return {"gantt": gantt, "results": results, "avg_waiting_time": round(avg_wait,2),
            "avg_turnaround_time": round(avg_tat,2), "time_quantum": req.time_quantum}

@app.post("/api/demo")
def run_demo(req: DemoRequest):
    demo_faults = [
        {"id":"F1","node":"S1", "burst":8,  "arrival":0,"crew":"Crew-Alpha",  "critical":True},
        {"id":"F2","node":"S10","burst":5,  "arrival":1,"crew":"Crew-Bravo",  "critical":False},
        {"id":"F3","node":"S19","burst":10, "arrival":2,"crew":"Crew-Charlie","critical":False},
    ]
    bfs_results, dfs_results = [], []
    for f in demo_faults:
        depot, path, hops = nearest_depot(f["node"])
        bfs_results.append({"fault_id":f["id"],"fault_node":f["node"],"depot":depot,"path":path,"hops":hops})
        dfs_results.append({"fault_id":f["id"],"fault_node":f["node"],
                            "affected_count":len(dfs_affected_zones(f["node"])),
                            "affected_zones":dfs_affected_zones(f["node"])})
    gantt, sched = run_round_robin(demo_faults, req.time_quantum)
    avg_wait = sum(r["waiting"] for r in sched)/len(sched) if sched else 0
    return {"demo_faults":demo_faults,"bfs_results":bfs_results,"dfs_results":dfs_results,
            "gantt":gantt,"schedule_results":sched,"avg_waiting_time":round(avg_wait,2),
            "time_quantum":req.time_quantum}

@app.get("/")
def root():
    return {"status": "Grid Fault Management API v2 running", "docs": "/docs"}
