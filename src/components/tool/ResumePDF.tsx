import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts for professional look
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGkyAZ9hiA.woff2', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2', fontWeight: 900 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#000000',
    marginBottom: 5,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 5,
  },
  contactItem: {
    fontSize: 9,
    color: '#6b7280',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: '#000000',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 5,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
  },
  entry: {
    marginBottom: 15,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#111827',
  },
  entrySubtitle: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 9,
    color: '#9ca3af',
  },
  entryDescription: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#4b5563',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 10,
  },
  bullet: {
    width: 10,
    fontSize: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.5,
    color: '#4b5563',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  }
});

interface ResumePDFProps {
  data: any;
  accentColor: string;
}

const ResumePDF = ({ data, accentColor }: ResumePDFProps) => {
  const formatBullets = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const cleanLine = line.replace(/^\*|\-|\d+\./, '').trim();
      if (!cleanLine) return null;
      return (
        <View key={i} style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{cleanLine}</Text>
        </View>
      );
    });
  };

  return (
    <Document title={`${data.personalInfo.fullName || 'Resume'} - Toolverse`}>
      <Page size="A4" style={styles.page}>
        {/* Accent Top Bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.personalInfo.fullName}</Text>
          <View style={styles.contactRow}>
            {data.personalInfo.email && <Text style={styles.contactItem}>{data.personalInfo.email}</Text>}
            {data.personalInfo.phone && <Text style={styles.contactItem}>{data.personalInfo.phone}</Text>}
            {data.personalInfo.location && <Text style={styles.contactItem}>{data.personalInfo.location}</Text>}
          </View>
        </View>

        {/* Summary */}
        {data.personalInfo.summary && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: accentColor }]}>Professional Profile</Text>
            <Text style={styles.summary}>{data.personalInfo.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: accentColor }]}>Experience</Text>
            {data.experience.map((exp: any) => (
              <View key={exp.id} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{exp.company}</Text>
                  <Text style={styles.entryDate}>{exp.period}</Text>
                </View>
                <Text style={styles.entrySubtitle}>{exp.role}</Text>
                {exp.description && (
                  <View style={{ marginTop: 4 }}>
                    {formatBullets(exp.description)}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: accentColor }]}>Education</Text>
            {data.education.map((edu: any) => (
              <View key={edu.id} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{edu.school}</Text>
                  <Text style={styles.entryDate}>{edu.period}</Text>
                </View>
                <Text style={styles.entrySubtitle}>{edu.degree}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: accentColor }]}>Projects</Text>
            {data.projects.map((proj: any) => (
              <View key={proj.id} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{proj.name}</Text>
                  {proj.link && <Text style={styles.entryDate}>{proj.link}</Text>}
                </View>
                <Text style={styles.entrySubtitle}>{proj.role}</Text>
                {proj.description && (
                  <View style={{ marginTop: 4 }}>
                    {formatBullets(proj.description)}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: accentColor }]}>Core Competencies</Text>
            <View style={styles.skillsContainer}>
              {data.skills.map((skill: string, i: number) => (
                <Text key={i} style={styles.skillBadge}>{skill}</Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ResumePDF;
