use crate::infrastructure::database::crdt::{Crdt, CrdtType, LWWRegister, ORSet};
use crate::shared::AppResult;

#[derive(Debug, Clone, Copy)]
pub enum MergeStrategy {
    LWW,      // Last-Write-Wins
    ORSet,    // Observed-Remove Set
    Counter,  // CRDT Counter
}

pub fn merge_crdts(local: &Crdt, remote: &Crdt) -> AppResult<Crdt> {
    if local.id != remote.id {
        return Err(crate::shared::AppError::Internal(
            "Cannot merge CRDTs with different IDs".to_string(),
        ));
    }

    match (&local.crdt_type, &remote.crdt_type) {
        (CrdtType::LWWRegister, CrdtType::LWWRegister) => {
            merge_lww(local, remote)
        }
        (CrdtType::ORSet, CrdtType::ORSet) => {
            merge_orset(local, remote)
        }
        (CrdtType::Counter, CrdtType::Counter) => {
            merge_counter(local, remote)
        }
        _ => Err(crate::shared::AppError::Internal(
            "Cannot merge different CRDT types".to_string(),
        )),
    }
}

fn merge_lww(local: &Crdt, remote: &Crdt) -> AppResult<Crdt> {
    let local_value = local.value.value.as_str()
        .ok_or_else(|| crate::shared::AppError::Internal("Invalid LWW value".to_string()))?;
    let remote_value = remote.value.value.as_str()
        .ok_or_else(|| crate::shared::AppError::Internal("Invalid LWW value".to_string()))?;

    let local_reg = LWWRegister::new(local_value.to_string(), local.value.timestamp);
    let remote_reg = LWWRegister::new(remote_value.to_string(), remote.value.timestamp);
    let merged = local_reg.merge(&remote_reg);

    let mut result = local.clone();
    result.value.value = serde_json::Value::String(merged.value);
    result.value.timestamp = merged.timestamp;

    // Merge vector clocks
    for (node_id, timestamp) in &remote.value.vector_clock {
        result.update_vector_clock(node_id.clone(), *timestamp);
    }

    Ok(result)
}

fn merge_orset(local: &Crdt, remote: &Crdt) -> AppResult<Crdt> {
    let mut local_set = ORSet::new();
    if let Some(arr) = local.value.value.as_array() {
        for val in arr {
            if let Some(s) = val.as_str() {
                local_set.add(s.to_string());
            }
        }
    }

    let mut remote_set = ORSet::new();
    if let Some(arr) = remote.value.value.as_array() {
        for val in arr {
            if let Some(s) = val.as_str() {
                remote_set.add(s.to_string());
            }
        }
    }

    local_set.merge(&remote_set);

    let elements: Vec<serde_json::Value> = local_set.elements
        .iter()
        .map(|s| serde_json::Value::String(s.clone()))
        .collect();

    let mut result = local.clone();
    result.value.value = serde_json::Value::Array(elements);

    // Merge vector clocks
    for (node_id, timestamp) in &remote.value.vector_clock {
        result.update_vector_clock(node_id.clone(), *timestamp);
    }

    Ok(result)
}

fn merge_counter(local: &Crdt, remote: &Crdt) -> AppResult<Crdt> {
    let local_count = local.value.value.as_i64()
        .ok_or_else(|| crate::shared::AppError::Internal("Invalid counter value".to_string()))?;
    let remote_count = remote.value.value.as_i64()
        .ok_or_else(|| crate::shared::AppError::Internal("Invalid counter value".to_string()))?;

    // For counters, we use vector clock to determine increments
    // Simple merge: take maximum
    let merged_count = local_count.max(remote_count);

    let mut result = local.clone();
    result.value.value = serde_json::Value::Number(merged_count.into());

    // Merge vector clocks
    for (node_id, timestamp) in &remote.value.vector_clock {
        result.update_vector_clock(node_id.clone(), *timestamp);
    }

    Ok(result)
}

