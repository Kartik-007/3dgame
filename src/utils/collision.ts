/**
 * Collision - Utility functions for collision detection
 */

import * as THREE from 'three';

export class Collision {
  /**
   * Check for collision between two spheres
   */
  static sphereToSphere(
    position1: THREE.Vector3,
    radius1: number,
    position2: THREE.Vector3,
    radius2: number
  ): boolean {
    const distance = position1.distanceTo(position2);
    return distance < (radius1 + radius2);
  }

  /**
   * Check for collision between a ray and a sphere
   * Returns the distance to the collision point, or -1 if no collision
   */
  static rayToSphere(
    rayOrigin: THREE.Vector3,
    rayDirection: THREE.Vector3,
    spherePosition: THREE.Vector3,
    sphereRadius: number
  ): number {
    // Implementation based on ray-sphere intersection algorithm
    const m = new THREE.Vector3().copy(rayOrigin).sub(spherePosition);
    const b = m.dot(rayDirection);
    const c = m.dot(m) - sphereRadius * sphereRadius;
    
    // If ray origin is outside the sphere and pointing away from it
    if (c > 0 && b > 0) {
      return -1;
    }
    
    const discriminant = b * b - c;
    
    // If discriminant is negative, no intersection
    if (discriminant < 0) {
      return -1;
    }
    
    // Calculate the distance to the closest intersection point
    const distance = -b - Math.sqrt(discriminant);
    
    // If distance is negative, the intersection is behind the ray origin
    return distance < 0 ? -1 : distance;
  }

  /**
   * Check for collision between a ray and a box
   * Returns the distance to the collision point, or -1 if no collision
   */
  static rayToBox(
    rayOrigin: THREE.Vector3,
    rayDirection: THREE.Vector3,
    boxPosition: THREE.Vector3,
    boxSize: THREE.Vector3
  ): number {
    // Convert box to min/max coordinates
    const boxMin = new THREE.Vector3(
      boxPosition.x - boxSize.x / 2,
      boxPosition.y - boxSize.y / 2,
      boxPosition.z - boxSize.z / 2
    );
    
    const boxMax = new THREE.Vector3(
      boxPosition.x + boxSize.x / 2,
      boxPosition.y + boxSize.y / 2,
      boxPosition.z + boxSize.z / 2
    );
    
    // Implementation based on ray-AABB intersection algorithm
    let tmin = -Infinity;
    let tmax = Infinity;
    
    // For each axis
    for (let i = 0; i < 3; i++) {
      const axis = i === 0 ? 'x' : (i === 1 ? 'y' : 'z');
      const invD = 1.0 / rayDirection[axis];
      let t0 = (boxMin[axis] - rayOrigin[axis]) * invD;
      let t1 = (boxMax[axis] - rayOrigin[axis]) * invD;
      
      // Swap if necessary
      if (invD < 0) {
        [t0, t1] = [t1, t0];
      }
      
      tmin = Math.max(tmin, t0);
      tmax = Math.min(tmax, t1);
      
      if (tmax <= tmin) {
        return -1;
      }
    }
    
    // If tmin is negative, the intersection is behind the ray's origin
    return tmin < 0 ? -1 : tmin;
  }

  /**
   * Check if a point is inside a box
   */
  static pointInBox(
    point: THREE.Vector3,
    boxPosition: THREE.Vector3,
    boxSize: THREE.Vector3
  ): boolean {
    return (
      point.x >= boxPosition.x - boxSize.x / 2 &&
      point.x <= boxPosition.x + boxSize.x / 2 &&
      point.y >= boxPosition.y - boxSize.y / 2 &&
      point.y <= boxPosition.y + boxSize.y / 2 &&
      point.z >= boxPosition.z - boxSize.z / 2 &&
      point.z <= boxPosition.z + boxSize.z / 2
    );
  }

  /**
   * Check for collision between a sphere and a box
   */
  static sphereToBox(
    spherePosition: THREE.Vector3,
    sphereRadius: number,
    boxPosition: THREE.Vector3,
    boxSize: THREE.Vector3
  ): boolean {
    // Find the closest point on the box to the sphere center
    const closestPoint = new THREE.Vector3(
      Math.max(boxPosition.x - boxSize.x / 2, Math.min(spherePosition.x, boxPosition.x + boxSize.x / 2)),
      Math.max(boxPosition.y - boxSize.y / 2, Math.min(spherePosition.y, boxPosition.y + boxSize.y / 2)),
      Math.max(boxPosition.z - boxSize.z / 2, Math.min(spherePosition.z, boxPosition.z + boxSize.z / 2))
    );
    
    // Check if the closest point is inside the sphere
    const distance = spherePosition.distanceTo(closestPoint);
    return distance < sphereRadius;
  }
} 