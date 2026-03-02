import { describe, it, expect } from 'vitest';
import {
  relationshipsWithUserToGraphEdges,
  relationshipToGraphEdge,
  inverseRelationshipToGraphEdge,
} from '@/lib/graph-utils';

describe('graph-utils', () => {
  describe('relationshipsWithUserToGraphEdges', () => {
    it('should create both edges when inverse is provided', () => {
      const person = {
        id: 'person-1',
        relationshipToUser: {
          label: 'Child',
          color: '#F59E0B',
          inverse: {
            label: 'Parent',
            color: '#F59E0B',
          },
        },
      };

      const edges = relationshipsWithUserToGraphEdges(person, 'user-1');

      expect(edges).toHaveLength(2);
      expect(edges[0]).toEqual({
        source: 'person-1',
        target: 'user-1',
        type: 'Child',
        color: '#F59E0B',
      });
      expect(edges[1]).toEqual({
        source: 'user-1',
        target: 'person-1',
        type: 'Parent',
        color: '#F59E0B',
      });
    });

    it('should fall back to type itself when inverse is null (symmetric types)', () => {
      const person = {
        id: 'person-1',
        relationshipToUser: {
          label: 'Relative',
          color: '#6366F1',
          inverse: null,
        },
      };

      const edges = relationshipsWithUserToGraphEdges(person, 'user-1');

      expect(edges).toHaveLength(2);
      expect(edges[0]).toEqual({
        source: 'person-1',
        target: 'user-1',
        type: 'Relative',
        color: '#6366F1',
      });
      expect(edges[1]).toEqual({
        source: 'user-1',
        target: 'person-1',
        type: 'Relative',
        color: '#6366F1',
      });
    });

    it('should return no edges when relationshipToUser is null', () => {
      const person = {
        id: 'person-1',
        relationshipToUser: null,
      };

      const edges = relationshipsWithUserToGraphEdges(person, 'user-1');

      expect(edges).toHaveLength(0);
    });
  });

  describe('relationshipToGraphEdge', () => {
    it('should create a forward edge', () => {
      const relationship = {
        personId: 'person-1',
        relatedPersonId: 'person-2',
        relationshipType: {
          label: 'Parent',
          color: '#F59E0B',
        },
      };

      const edge = relationshipToGraphEdge(relationship);

      expect(edge).toEqual({
        source: 'person-1',
        target: 'person-2',
        type: 'Parent',
        color: '#F59E0B',
      });
    });

    it('should return undefined when relationshipType is null', () => {
      const relationship = {
        personId: 'person-1',
        relatedPersonId: 'person-2',
        relationshipType: null,
      };

      const edge = relationshipToGraphEdge(relationship);

      expect(edge).toBeUndefined();
    });
  });

  describe('inverseRelationshipToGraphEdge', () => {
    it('should create an inverse edge using the inverse type', () => {
      const relationship = {
        personId: 'person-1',
        relatedPersonId: 'person-2',
        relationshipType: {
          label: 'Parent',
          color: '#F59E0B',
          inverse: {
            label: 'Child',
            color: '#F59E0B',
          },
        },
      };

      const edge = inverseRelationshipToGraphEdge(relationship);

      expect(edge).toEqual({
        source: 'person-2',
        target: 'person-1',
        type: 'Child',
        color: '#F59E0B',
      });
    });

    it('should fall back to type itself when inverse is null (symmetric types)', () => {
      const relationship = {
        personId: 'person-1',
        relatedPersonId: 'person-2',
        relationshipType: {
          label: 'Relative',
          color: '#6366F1',
          inverse: null,
        },
      };

      const edge = inverseRelationshipToGraphEdge(relationship);

      expect(edge).toEqual({
        source: 'person-2',
        target: 'person-1',
        type: 'Relative',
        color: '#6366F1',
      });
    });

    it('should return undefined when relationshipType is null', () => {
      const relationship = {
        personId: 'person-1',
        relatedPersonId: 'person-2',
        relationshipType: null,
      };

      const edge = inverseRelationshipToGraphEdge(relationship);

      expect(edge).toBeUndefined();
    });
  });
});
